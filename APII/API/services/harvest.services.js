import { v4 as uuidv4 } from 'uuid';

const toDateTimeValue = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const mapHarvestRow = (row) => ({
    id: row.id,
    crop: row.crop,
    category: row.category,
    quantity: Number(row.quantity) || 0,
    date: row.date ? new Date(row.date) : new Date(),
    recordedBy: row.recorded_by,
    recordedByPartnerName: row.recorded_by_partner_name || undefined,
    recordedByUser: row.recorded_by_user ?? null,
    purchasePriceClp: row.purchase_price_clp ?? undefined,
    salePriceClp: row.sale_price_clp ?? undefined
});

export default (db) => ({
    async findAll() {
        const query = 'SELECT * FROM harvests ORDER BY date DESC';
        try {
            const results = await db.mysqlquery(query);
            if (!results.success) throw new Error(results.error);
            const payload = results.data.map(mapHarvestRow);
            return {
                success: true,
                status: 200, // Devuelve 200 aunque la lista esté vacía
                data: payload,
                error: null
            };
        } catch (error) {
            return { success: false, status: 500, data: [], error: error.message };
        }
    },

    async create(data) {
        const id = uuidv4();
        const queryInsert = `
            INSERT INTO harvests 
            (id, crop, category, quantity, date, recorded_by, recorded_by_partner_name, recorded_by_user, purchase_price_clp, sale_price_clp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [
            id,
            data.crop,
            data.category,
            data.quantity,
            toDateTimeValue(data.date ?? new Date()),
            data.recordedBy || null,
            data.recordedByPartnerName || null,
            data.recordedByUser || null,
            data.purchasePriceClp ?? null,
            data.salePriceClp ?? null
        ];

        const increaseInventoryQuery = `
            UPDATE inventory_items 
            SET quantity = quantity + ? 
            WHERE name = ?;
        `;

        try {
            const results = await db.mysqlquery(queryInsert, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;

            if (success) {
                await db.mysqlquery(increaseInventoryQuery, [data.quantity, data.crop]);
            }

            return {
                success,
                status: success ? 201 : 500,
                data: { id },
                error: success ? null : 'No se pudo crear la cosecha'
            };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: error.message };
        }
    },

    async update(id, payload) {
        const updateQuery = `
            UPDATE harvests SET
            crop = ?,
            category = ?,
            quantity = ?,
            date = ?,
            recorded_by = ?,
            recorded_by_partner_name = ?,
            recorded_by_user = ?,
            purchase_price_clp = ?,
            sale_price_clp = ?
            WHERE id = ?;
        `;

        const values = [
            payload.crop,
            payload.category,
            payload.quantity,
            toDateTimeValue(payload.date ?? new Date()),
            payload.recordedBy || null,
            payload.recordedByPartnerName || null,
            payload.recordedByUser || null,
            payload.purchasePriceClp ?? null,
            payload.salePriceClp ?? null,
            id
        ];

        try {
            const results = await db.mysqlquery(updateQuery, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return {
                success,
                status: success ? 200 : 404,
                data: success ? { id } : {},
                error: success ? null : 'Harvest not found'
            };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: error.message };
        }
    },

    async delete(id) {
        try {
            const getHarvest = await db.mysqlquery('SELECT * FROM harvests WHERE id = ?', [id]);
            if (!getHarvest.success) throw new Error(getHarvest.error);
            if (getHarvest.data.length === 0) return { success: false, status: 404, error: "Harvest not found" };
            
            const harvestData = getHarvest.data[0];

            const queryDelete = 'DELETE FROM harvests WHERE id = ?;';
            const results = await db.mysqlquery(queryDelete, [id]);
            if (!results.success) throw new Error(results.error);
            
            if (results.data.affectedRows > 0) {
                const reduceStock = 'UPDATE inventory_items SET quantity = quantity - ? WHERE name = ?';
                await db.mysqlquery(reduceStock, [harvestData.quantity, harvestData.crop]);
            }

            return {
                success: results.data.affectedRows > 0,
                status: results.data.affectedRows > 0 ? 200 : 404,
                data: results.data,
                error: null
            };
        } catch (error) {
            return { success: false, status: 500, error: error.message };
        }
    }
});