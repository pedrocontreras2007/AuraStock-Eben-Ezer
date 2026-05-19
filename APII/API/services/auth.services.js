import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export default (db) => ({

    async login(email, password) {
        try {
            const result = await db.mysqlquery(
                `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.is_active,
                        u.tenant_id, t.name AS tenant_name, t.slug AS tenant_slug,
                        u.branch_id, b.name AS branch_name
                 FROM users u
                 JOIN tenants t ON u.tenant_id = t.id
                 LEFT JOIN branches b ON u.branch_id = b.id
                 WHERE u.email = ?`,
                [email]
            );
            if (!result.success || result.data.length === 0) {
                return { success: false, status: 401, error: 'Credenciales inválidas' };
            }

            const user = result.data[0];
            if (!user.is_active) {
                return { success: false, status: 403, error: 'Cuenta desactivada' };
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return { success: false, status: 401, error: 'Credenciales inválidas' };
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return { success: false, status: 500, error: 'Error de configuración del servidor' };
            }

            const tokenPayload = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenant_id,
                tenantName: user.tenant_name,
                tenantSlug: user.tenant_slug,
                branchId: user.branch_id,
                branchName: user.branch_name
            };

            const token = jwt.sign(tokenPayload, secret, { expiresIn: '24h' });

            return {
                success: true,
                status: 200,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        tenantId: user.tenant_id,
                        tenantName: user.tenant_name,
                        tenantSlug: user.tenant_slug,
                        branchId: user.branch_id,
                        branchName: user.branch_name
                    }
                }
            };
        } catch (error) {
            return { success: false, status: 500, error: 'Error interno del servidor' };
        }
    },

    async register(data) {
        try {
            const existing = await db.mysqlquery('SELECT id FROM users WHERE email = ?', [data.email]);
            if (existing.success && existing.data.length > 0) {
                return { success: false, status: 409, error: 'El correo ya está registrado' };
            }

            const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
            const id = uuidv4();

            const insertResult = await db.mysqlquery(
                `INSERT INTO users (id, tenant_id, branch_id, email, password_hash, name, role)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, data.tenantId, data.branchId || null, data.email, passwordHash, data.name, data.role || 'operator']
            );

            if (!insertResult.success) throw new Error(insertResult.error);
            const success = insertResult.data.affectedRows > 0;

            return {
                success,
                status: success ? 201 : 500,
                data: success ? { id } : null,
                error: success ? null : 'No se pudo crear el usuario'
            };
        } catch (error) {
            return { success: false, status: 500, error: 'Error al registrar usuario' };
        }
    },

    async getTenants() {
        try {
            const result = await db.mysqlquery(
                'SELECT id, name, slug, logo_url FROM tenants WHERE is_active = 1 ORDER BY name'
            );
            if (!result.success) throw new Error(result.error);
            return { success: true, status: 200, data: result.data, error: null };
        } catch (error) {
            return { success: false, status: 500, data: [], error: 'Error al obtener empresas' };
        }
    }
});
