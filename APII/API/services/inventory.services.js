import { v4 as uuidv4 } from 'uuid';

const toDateValue = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const mapInventoryRow = (row) => ({
    id: row.id,
    name: row.name,
    quantity: String(row.quantity ?? ''),
    unit: row.unit,
    category: row.category,
    minStock: row.min_stock ?? 10,
    criticalStock: row.critical_stock ?? 5,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    recordedBy: row.recorded_by,
    recordedByUser: row.recorded_by_user ?? null,
    inventoryDate: row.inventory_date || null
});

export default (db) => ({
    async findAll(tenantId, branchId) {
        let query = 'SELECT * FROM inventory_items WHERE tenant_id = ?';
        const params = [tenantId];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        query += ' ORDER BY name ASC';

        try {
            const results = await db.mysqlquery(query, params);
            if (!results.success) throw new Error(results.error);
            const payload = results.data.map(mapInventoryRow);
            return { success: true, status: 200, data: payload, error: null };
        } catch (error) {
            return { success: false, status: 500, data: [], error: 'Error al cargar inventario' };
        }
    },

    async create(data, tenantId, branchId) {
        const id = uuidv4();
        const query = `INSERT INTO inventory_items 
            (id, tenant_id, branch_id, name, quantity, unit, category, min_stock, critical_stock, recorded_by, recorded_by_user, inventory_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            id, tenantId, branchId || null,
            data.name, data.quantity, data.unit || 'unidades',
            data.category, data.minStock ?? 10, data.criticalStock ?? 5,
            data.recordedBy || null, data.recordedByUser || null,
            toDateValue(data.inventoryDate)
        ];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear' };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: 'Error al crear item' };
        }
    },

    async update(id, data, tenantId) {
        const query = `UPDATE inventory_items SET 
            name = ?, quantity = ?, unit = ?, category = ?,
            min_stock = ?, critical_stock = ?,
            recorded_by = ?, recorded_by_user = ?,
            inventory_date = ?
            WHERE id = ? AND tenant_id = ?`;
        const values = [
            data.name, data.quantity, data.unit || 'unidades', data.category,
            data.minStock ?? 10, data.criticalStock ?? 5,
            data.recordedBy || null, data.recordedByUser || null,
            toDateValue(data.inventoryDate),
            id, tenantId
        ];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, error: success ? null : 'Item no encontrado' };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al actualizar item' };
        }
    },

    async delete(id, tenantId) {
        const query = 'DELETE FROM inventory_items WHERE id = ? AND tenant_id = ?';
        try {
            const results = await db.mysqlquery(query, [id, tenantId]);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, error: success ? null : 'Item no encontrado' };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al eliminar item' };
        }
    }
});
