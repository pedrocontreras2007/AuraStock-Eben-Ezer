import { v4 as uuidv4 } from 'uuid';

export default (db) => ({

    async findAll() {
        const query = 'SELECT id, name, slug, logo_url, contact_email, contact_phone FROM tenants';
        try {
            const results = await db.mysqlquery(query);
            if (!results.success) throw new Error(results.error);
            return {
                success: true,
                status: results.data.length > 0 ? 200 : 200,
                data: results.data,
                error: null
            };
        } catch (error) {
            return { success: false, status: 500, data: [], error: 'Error al obtener empresas' };
        }
    },

    async findBySlug(slug) {
        const query = 'SELECT id, name, slug, logo_url, contact_email, contact_phone FROM tenants WHERE slug = ?';
        try {
            const results = await db.mysqlquery(query, [slug]);
            if (!results.success) throw new Error(results.error);
            const tenant = results.data[0] || null;
            return {
                success: true,
                status: tenant ? 200 : 404,
                data: tenant,
                error: tenant ? null : 'Empresa no encontrada'
            };
        } catch (error) {
            return { success: false, status: 500, data: null, error: 'Error al buscar empresa' };
        }
    },

    async create(data) {
        const id = uuidv4();
        const query = `INSERT INTO tenants (id, name, slug, logo_url, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [id, data.name, data.slug, data.logoUrl || null, data.contactEmail || null, data.contactPhone || null];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 201 : 500, data: { id }, error: success ? null : 'No se pudo crear' };
        } catch (error) {
            return { success: false, status: 500, data: null, error: 'Error al crear empresa' };
        }
    },

    async update(id, data) {
        const query = `UPDATE tenants SET name = ?, slug = ?, logo_url = ?, contact_email = ?, contact_phone = ? WHERE id = ?`;
        const values = [data.name, data.slug, data.logoUrl || null, data.contactEmail || null, data.contactPhone || null, id];
        try {
            const results = await db.mysqlquery(query, values);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, error: success ? null : 'Empresa no encontrada' };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al actualizar empresa' };
        }
    },

    async delete(id) {
        const query = 'DELETE FROM tenants WHERE id = ?';
        try {
            const results = await db.mysqlquery(query, [id]);
            if (!results.success) throw new Error(results.error);
            const success = results.data.affectedRows > 0;
            return { success, status: success ? 200 : 404, error: success ? null : 'Empresa no encontrada' };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al eliminar empresa' };
        }
    }
});
