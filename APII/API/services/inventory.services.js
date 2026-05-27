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
    inventoryDate: row.inventory_date || null,
    sortOrder: row.sort_order ?? 0,
    countedAt: row.counted_at || null
});

export default (db) => ({
    async findAll(tenantId, branchId) {
        let query = 'SELECT * FROM inventory_items WHERE tenant_id = ?';
        const params = [tenantId];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        query += ' ORDER BY category ASC, sort_order ASC, name ASC';

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
            (id, tenant_id, branch_id, name, quantity, unit, category, sort_order, min_stock, critical_stock, recorded_by, recorded_by_user, inventory_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            id, tenantId, branchId || null,
            data.name, data.quantity, data.unit || 'unidades',
            data.category, data.sortOrder ?? 0, data.minStock ?? 10, data.criticalStock ?? 5,
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
    },

    async reorder(orders, tenantId) {
        if (!Array.isArray(orders) || orders.length === 0) {
            return { success: false, status: 400, error: 'Se requiere un array de órdenes' };
        }
        try {
            const cases = orders.map(() => 'WHEN ? THEN ?').join(' ');
            const ids = orders.flatMap(o => [o.id, o.sortOrder]);
            const idList = orders.map(o => o.id);
            const query = `UPDATE inventory_items SET sort_order = CASE id ${cases} ELSE sort_order END WHERE tenant_id = ? AND id IN (${idList.map(() => '?').join(',')})`;
            const results = await db.mysqlquery(query, [...ids, tenantId, ...idList]);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, error: null };
        } catch (error) {
            console.error("Error al reordenar en BD:", error);
            return { success: false, status: 500, error: 'Error al reordenar productos' };
        }
    },

    async markCounted(id, tenantId) {
        const chileDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const query = 'UPDATE inventory_items SET counted_at = NOW(), inventory_date = ? WHERE id = ? AND tenant_id = ?';
        try {
            const results = await db.mysqlquery(query, [chileDate, id, tenantId]);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, error: null };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al marcar producto como contado' };
        }
    },

    async markUncounted(id, tenantId) {
        const query = 'UPDATE inventory_items SET counted_at = NULL WHERE id = ? AND tenant_id = ?';
        try {
            const results = await db.mysqlquery(query, [id, tenantId]);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, error: null };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al desmarcar producto' };
        }
    },

    async resetCounts(tenantId, branchId) {
        let query = 'UPDATE inventory_items SET counted_at = NULL WHERE tenant_id = ?';
        const params = [tenantId];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        try {
            const results = await db.mysqlquery(query, params);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, error: null };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al reiniciar conteo' };
        }
    }
});
