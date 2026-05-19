import { v4 as uuidv4 } from 'uuid';

const toDateTimeValue = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date();
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const mapLossRow = (row) => ({
    id: row.id,
    productName: row.product_name,
    quantity: Number(row.quantity) || 0,
    reason: row.reason,
    date: row.date ? new Date(row.date) : new Date(),
    recordedBy: row.recorded_by,
    recordedByPartnerName: row.recorded_by_partner_name || undefined,
    recordedByUser: row.recorded_by_user ?? null,
    sourceType: row.source_type || null,
    sourceId: row.source_id || null
});

const adjustStockAfterLossChange = async (db, { sourceType, sourceId, productName }, amount) => {
    if (!sourceType) {
        return;
    }

    if (sourceType === 'inventory') {
        if (sourceId) {
            const result = await db.mysqlquery(
                'UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?',
                [amount, sourceId]
            );
            if (!result.success) throw new Error(result.error);
        } else {
            const result = await db.mysqlquery(
                'UPDATE inventory_items SET quantity = quantity + ? WHERE name = ?',
                [amount, productName]
            );
            if (!result.success) throw new Error(result.error);
        }
    }

    if (sourceType === 'harvest') {
        if (sourceId) {
            const result = await db.mysqlquery(
                'UPDATE harvests SET quantity = quantity + ? WHERE id = ?',
                [amount, sourceId]
            );
            if (!result.success) throw new Error(result.error);
        } else {
            const result = await db.mysqlquery(
                'UPDATE harvests SET quantity = quantity + ? WHERE crop = ?',
                [amount, productName]
            );
            if (!result.success) throw new Error(result.error);
        }
    }
};

export default (db) => ({
    async findAll() {
        const query = 'SELECT * FROM losses ORDER BY date DESC';
        try {
            const results = await db.mysqlquery(query);
            if (!results.success) throw new Error(results.error);
            const payload = results.data.map(mapLossRow);
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
            INSERT INTO losses 
            (id, product_name, quantity, reason, date, recorded_by, recorded_by_partner_name, recorded_by_user, source_type, source_id) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [
            id,
            data.productName,
            data.quantity,
            data.reason,
            toDateTimeValue(data.date ?? new Date()),
            data.recordedBy || null,
            data.recordedByPartnerName || null,
            data.recordedByUser || null,
            data.sourceType || null,
            data.sourceId || null
        ];

        try {
            const results = await db.mysqlquery(queryInsert, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;

            if (success) {
                await adjustStockAfterLossChange(db, data, -data.quantity);
            }

            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear la merma' };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: error.message };
        }
    },

    async delete(id) {
        try {
            const getLoss = await db.mysqlquery('SELECT * FROM losses WHERE id = ?', [id]);
            if (!getLoss.success) throw new Error(getLoss.error);
            if (getLoss.data.length === 0) return { success: false, status: 404, error: "Loss not found" };
            
            const lossData = mapLossRow(getLoss.data[0]);

            const queryDelete = 'DELETE FROM losses WHERE id = ?;';
            const results = await db.mysqlquery(queryDelete, [id]);
            if (!results.success) throw new Error(results.error);
            
            if (results.data.affectedRows === 0) {
                return { success: false, status: 404, data: {}, error: 'Loss not found' };
            }

            await adjustStockAfterLossChange(db, lossData, lossData.quantity);

            return { success: true, status: 200, data: { id }, error: null };
        } catch (error) {
            return { success: false, status: 500, error: error.message };
        }
    }
});