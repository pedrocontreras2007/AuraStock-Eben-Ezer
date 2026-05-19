import { v4 as uuidv4 } from 'uuid';

const toDateTimeValue = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return new Date();
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const mapRow = (row) => ({
    id: row.id,
    productName: row.product_name,
    category: row.category,
    quantity: Number(row.quantity) || 0,
    date: row.date ? new Date(row.date) : new Date(),
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    recordedBy: row.recorded_by,
    recordedByUser: row.recorded_by_user ?? null,
    notes: row.notes || null
});

export default (db) => ({
    async findAll(tenantId, branchId) {
        let query = 'SELECT * FROM produccion WHERE tenant_id = ?';
        const params = [tenantId];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        query += ' ORDER BY date DESC';

        try {
            const results = await db.mysqlquery(query, params);
            if (!results.success) throw new Error(results.error);
            return { success: true, status: 200, data: results.data.map(mapRow), error: null };
        } catch (error) {
            return { success: false, status: 500, data: [], error: 'Error al cargar producción' };
        }
    },

    async create(data, tenantId, branchId) {
        const id = uuidv4();
        const queryInsert = `INSERT INTO produccion 
            (id, tenant_id, branch_id, product_name, category, quantity, date, recorded_by, recorded_by_user, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            id, tenantId, branchId || null,
            data.productName, data.category, data.quantity,
            toDateTimeValue(data.date ?? new Date()),
            data.recordedBy || null, data.recordedByUser || null,
            data.notes || null
        ];

        const increaseInventoryQuery = `UPDATE inventory_items SET quantity = quantity + ? WHERE name = ? AND tenant_id = ?`;

        try {
            const results = await db.mysqlquery(queryInsert, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            if (success) {
                await db.mysqlquery(increaseInventoryQuery, [data.quantity, data.productName, tenantId]);
            }
            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear' };
        } catch (error) {
            return { success: false, status: 500, data: {}, error: 'Error al registrar producción' };
        }
    },

    async update(id, payload, tenantId) {
        const updateQuery = `UPDATE produccion SET
            product_name = ?, category = ?, quantity = ?, date = ?,
            recorded_by = ?, recorded_by_user = ?, notes = ?
            WHERE id = ? AND tenant_id = ?`;
        const values = [
            payload.productName, payload.category, payload.quantity,
            toDateTimeValue(payload.date ?? new Date()),
            payload.recordedBy || null, payload.recordedByUser || null,
            payload.notes || null, id, tenantId
        ];
        try {
            const results = await db.mysqlquery(updateQuery, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, error: success ? null : 'Registro no encontrado' };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al actualizar producción' };
        }
    },

    async delete(id, tenantId) {
        try {
            const getRecord = await db.mysqlquery('SELECT * FROM produccion WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            if (!getRecord.success) throw new Error(getRecord.error);
            if (getRecord.data.length === 0) return { success: false, status: 404, error: 'Registro no encontrado' };

            const record = getRecord.data[0];
            const queryDelete = 'DELETE FROM produccion WHERE id = ? AND tenant_id = ?';
            const results = await db.mysqlquery(queryDelete, [id, tenantId]);
            if (!results.success) throw new Error(results.error);

            if (results.data.affectedRows > 0) {
                const reduceStock = 'UPDATE inventory_items SET quantity = quantity - ? WHERE name = ? AND tenant_id = ?';
                await db.mysqlquery(reduceStock, [record.quantity, record.product_name, tenantId]);
            }
            return { success: results.data.affectedRows > 0, status: results.data.affectedRows > 0 ? 200 : 404, data: results.data, error: null };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al eliminar registro' };
        }
    }
});
