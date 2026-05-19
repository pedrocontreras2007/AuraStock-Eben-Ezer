import { v4 as uuidv4 } from 'uuid';

const toDateTimeValue = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return new Date();
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const mapLossRow = (row) => ({
    id: row.id,
    productName: row.product_name,
    quantity: Number(row.quantity) || 0,
    reason: row.reason,
    date: row.date ? new Date(row.date) : new Date(),
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    recordedBy: row.recorded_by,
    recordedByUser: row.recorded_by_user ?? null,
    sourceType: row.source_type || null,
    sourceId: row.source_id || null
});

const adjustStockAfterLossChange = async (db, { sourceType, sourceId, productName, tenantId }, amount) => {
    if (!sourceType) return;

    if (sourceType === 'inventory') {
        if (sourceId) {
            await db.mysqlquery('UPDATE inventory_items SET quantity = quantity + ? WHERE id = ? AND tenant_id = ?', [amount, sourceId, tenantId]);
        } else {
            await db.mysqlquery('UPDATE inventory_items SET quantity = quantity + ? WHERE name = ? AND tenant_id = ?', [amount, productName, tenantId]);
        }
    }

    if (sourceType === 'produccion') {
        if (sourceId) {
            await db.mysqlquery('UPDATE produccion SET quantity = quantity + ? WHERE id = ? AND tenant_id = ?', [amount, sourceId, tenantId]);
        } else {
            await db.mysqlquery('UPDATE produccion SET quantity = quantity + ? WHERE product_name = ? AND tenant_id = ?', [amount, productName, tenantId]);
        }
    }
};

export default (db) => ({
    async findAll(tenantId, branchId) {
        let query = 'SELECT * FROM losses WHERE tenant_id = ?';
        const params = [tenantId];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        query += ' ORDER BY date DESC';
        try {
            const results = await db.mysqlquery(query, params);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, data: results.data.map(mapLossRow), error: null };
        } catch (error) {
            return { success: false, status: 500, data: [], error: 'Error al cargar mermas' };
        }
    },

    async create(data, tenantId, branchId) {
        const id = uuidv4();
        const queryInsert = `INSERT INTO losses 
            (id, tenant_id, branch_id, product_name, quantity, reason, date, recorded_by, recorded_by_user, source_type, source_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            id, tenantId, branchId || null,
            data.productName, data.quantity, data.reason,
            toDateTimeValue(data.date ?? new Date()),
            data.recordedBy || null, data.recordedByUser || null,
            data.sourceType || null, data.sourceId || null
        ];
        try {
            const results = await db.mysqlquery(queryInsert, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            if (success) {
                await adjustStockAfterLossChange(db, { ...data, tenantId }, -data.quantity);
            }
            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear' };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: 'Error al registrar merma' };
        }
    },

    async delete(id, tenantId) {
        try {
            const getLoss = await db.mysqlquery('SELECT * FROM losses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            if (!getLoss.success) throw new Error(getLoss.error);
            if (getLoss.data.length === 0) return { success: false, status: 404, error: 'Merma no encontrada' };

            const lossData = mapLossRow(getLoss.data[0]);
            const queryDelete = 'DELETE FROM losses WHERE id = ? AND tenant_id = ?';
            const results = await db.mysqlquery(queryDelete, [id, tenantId]);
            if (!results.success) throw new Error(results.error);
            if (results.data.affectedRows === 0) return { success: false, status: 404, error: 'Merma no encontrada' };

            await adjustStockAfterLossChange(db, { ...lossData, tenantId }, lossData.quantity);
            return { success: true, status: 200, data: { id }, error: null };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al eliminar merma' };
        }
    }
});
