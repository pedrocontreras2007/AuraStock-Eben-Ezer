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
    });
};

initServer();
