import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import DB from "./middleware/db.js";
import { extractUser } from "./middleware/userContext.js";
import { filterByTenant } from "./middleware/tenant.js";

import authRouterFactory from "./routes/auth.routes.js";
import harvestRouterFactory from "./routes/harvest.routes.js";
import inventoryRouterFactory from "./routes/inventory.routes.js";
import lossesRouterFactory from "./routes/losses.routes.js";
import tenantRouterFactory from "./routes/tenants.routes.js";

dotenv.config();

const initServer = () => {
    const app = express();
    const server = http.createServer(app);
    const db = new DB();
    const dConnection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
    };
    db.setDataConnection(dConnection);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const allowAll = allowedOriginsRaw.includes('*');
    const allowedOrigins = allowAll ? [] : allowedOriginsRaw;

    app.use(cors(allowAll ? {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        credentials: true
    } : {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origen no permitido: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        credentials: true
    }));

    // Middleware global: extrae usuario JWT si existe
    app.use(extractUser);
    app.use(filterByTenant);

    // Rutas públicas (auth)
    const authRouter = authRouterFactory(db);
    app.use("/api/auth", authRouter);

    // Rutas protegidas
    const harvestRouter = harvestRouterFactory(db);
    app.use("/api/produccion", harvestRouter);

    const inventoryRouter = inventoryRouterFactory(db);
    app.use("/api/inventory", inventoryRouter);

    const lossesRouter = lossesRouterFactory(db);
    app.use("/api/losses", lossesRouter);

    const tenantRouter = tenantRouterFactory(db);
    app.use("/api/tenants", tenantRouter);

    const port = Number(process.env.APP_PORT) || 3000;
    const host = process.env.APP_HOST || "0.0.0.0";

    app.set("trust proxy", true);

    app.get("/", (req, res) => {
        res.status(200).json({ message: "AuraStøck API funcionando" });
    });

    server.listen(port, host, async () => {
        console.log(`AuraStøck API en ${host}:${port}`);
        const envRaw = process.env.ALLOWED_ORIGINS || '(no definido)';
        const corsMsg = allowAll ? '*' : (allowedOrigins.join(', ') || envRaw);
        console.log(`CORS permitido para: ${corsMsg}`);

        // Migración: quantity pasa a TEXT para admitir descripciones como "5 botellas y media"
        try {
            const mig = await db.mysqlquery(
                `ALTER TABLE inventory_items MODIFY COLUMN quantity VARCHAR(100) NOT NULL DEFAULT '0'`
            );
            if (mig.success) console.log('✓ Migración quantity → VARCHAR(100) OK');
            else console.warn('⚠ Migración quantity:', mig.error);
        } catch (e) {
            console.warn('⚠ Migración quantity (no crítica):', e.message);
        }

        // Migración: categorías actualizadas (se añaden las nuevas sin eliminar las viejas para no romper datos existentes)
        try {
            const migCat = await db.mysqlquery(
                `ALTER TABLE inventory_items MODIFY COLUMN category ENUM('materia_prima','salsas_gourmet','bebestibles','materiales_desechables','frutas','utiles_aseo') NOT NULL DEFAULT 'materia_prima'`
            );
            if (migCat.success) console.log('✓ Migración categorías OK');
            else console.warn('⚠ Migración categorías:', migCat.error);
        } catch (e) {
            console.warn('⚠ Migración categorías (no crítica):', e.message);
        }

        // Migración: columna inventory_date
        try {
            const migDate = await db.mysqlquery(
                `ALTER TABLE inventory_items ADD COLUMN inventory_date DATE DEFAULT NULL AFTER recorded_by_user`
            );
            if (migDate.success) console.log('✓ Migración inventory_date OK');
            else if (migDate.error?.includes('Duplicate column')) console.log('→ inventory_date ya existe');
            else console.warn('⚠ Migración inventory_date:', migDate.error);
        } catch (e) {
            if (e.message?.includes('Duplicate column')) console.log('→ inventory_date ya existe');
            else console.warn('⚠ Migración inventory_date (no crítica):', e.message);
        }

        // Migración: columna sort_order
        try {
            const migSort = await db.mysqlquery(
                `ALTER TABLE inventory_items ADD COLUMN sort_order INT DEFAULT 0 AFTER category`
            );
            if (migSort.success) {
                console.log('✓ Migración sort_order OK');
                const migSortOrder = await db.mysqlquery(
                    `UPDATE inventory_items i
                     JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY category ASC, name ASC) AS rn FROM inventory_items) AS o
                     ON i.id = o.id SET i.sort_order = o.rn`
                );
                if (migSortOrder.success) console.log('✓ Orden inicial asignado');
                else console.warn('⚠ Asignación orden inicial:', migSortOrder.error);
            } else if (migSort.error?.includes('Duplicate column')) {
                console.log('→ sort_order ya existe');
            } else {
                console.warn('⚠ Migración sort_order:', migSort.error);
            }
        } catch (e) {
            if (e.message?.includes('Duplicate column')) console.log('→ sort_order ya existe');
            else console.warn('⚠ Migración sort_order (no crítica):', e.message);
        }

        // Migración: columna counted_at
        try {
            const migCount = await db.mysqlquery(
                `ALTER TABLE inventory_items ADD COLUMN counted_at TIMESTAMP NULL DEFAULT NULL AFTER sort_order`
            );
            if (migCount.success) console.log('✓ Migración counted_at OK');
            else if (migCount.error?.includes('Duplicate column')) console.log('→ counted_at ya existe');
            else console.warn('⚠ Migración counted_at:', migCount.error);
        } catch (e) {
            if (e.message?.includes('Duplicate column')) console.log('→ counted_at ya existe');
            else console.warn('⚠ Migración counted_at (no crítica):', e.message);
        }

        // Auto-fix: Normalizar sort_order en 0 o nulos
        try {
            await db.mysqlquery(
                `UPDATE inventory_items i
                 JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY name ASC) AS rn FROM inventory_items) AS o
                 ON i.id = o.id SET i.sort_order = o.rn WHERE i.sort_order = 0 OR i.sort_order IS NULL`
            );
            console.log('✓ Orden inicial normalizado para items sin orden');
        } catch (e) {
            console.warn('⚠ Auto-fix sort_order fallido:', e.message);
        }
    });
};

initServer();
