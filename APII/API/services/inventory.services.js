import { v4 as uuidv4 } from 'uuid';

const mapInventoryRow = (row) => ({
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity) || 0,
    unit: row.unit,
    category: row.category,
    recordedBy: row.recorded_by,
    recordedByPartnerName: row.recorded_by_partner_name || undefined,
    recordedByUser: row.recorded_by_user ?? null
});

export default (db) => ({
    async findAll() {
        const query = 'SELECT * FROM inventory_items ORDER BY name ASC';
        try {
            const results = await db.mysqlquery(query);
            if (!results.success) throw new Error(results.error);
            const payload = results.data.map(mapInventoryRow);
            return {
                success: true,
                status: payload.length > 0 ? 200 : 404,
                data: payload,
                error: null
            };
        } catch (error) {
            return { success: false, status: 500, data: [], error: error.message };
        }
    },

    async create(data) {
        const id = uuidv4();
        const query = `
            INSERT INTO inventory_items 
            (id, name, quantity, unit, category, recorded_by, recorded_by_partner_name, recorded_by_user) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const values = [
            id,
            data.name,
            data.quantity,
            data.unit,
            data.category,
            data.recordedBy || null,
            data.recordedByPartnerName || null,
            data.recordedByUser || null
        ];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear el item' };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: error.message };
        }
    },

    // Función para editar stock (ej. cuando se gasta fertilizante o se rompe una herramienta)
    async update(id, data) {
        const query = `
            UPDATE inventory_items SET 
            name = ?,
            quantity = ?,
            unit = ?,
            category = ?,
            recorded_by = ?,
            recorded_by_partner_name = ?,
            recorded_by_user = ?
            WHERE id = ?;
        `;
        const values = [
            data.name,
            data.quantity,
            data.unit,
            data.category,
            data.recordedBy || null,
            data.recordedByPartnerName || null,
            data.recordedByUser || null,
            id
        ];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, data: success ? { id } : {}, error: success ? null : 'Item not found' };
        } catch (error) {
            return { success: false, status: 500, error: error.message };
        }
    },

    async delete(id) {
        const query = 'DELETE FROM inventory_items WHERE id = ?;';
        try {
            const results = await db.mysqlquery(query, [id]);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, data: success ? { id } : {}, error: success ? null : 'Item not found' };
        } catch (error) {
            return { success: false, status: 500, error: error.message };
        }
    }
}); 