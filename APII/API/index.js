import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
//Importamos el middleware de la base de datos
import DB from "./middleware/db.js";

import harvestRouterFactory from "./routes/harvest.routes.js";
import inventoryRouterFactory from "./routes/inventory.routes.js";
import lossesRouterFactory from "./routes/losses.routes.js";

//import tenantRouterFactory from "./routes/tenants.routes.js";

dotenv.config(); // Carga las variables de entorno desde el archivo .env

const initServer = () => {
    const app = express(); // Crea una instancia de la aplicación Express
    const server = http.createServer(app); // Crea un servidor HTTP con la aplicación Express
    const db = new DB(); // Crea una instancia de la clase DB para manejar la conexión a la base de datos
    const dConnection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
    }
    db.setDataConnection(dConnection); // Configura la conexión a la base de datos usando las variables de entorno

    app.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes como JSON
    app.use(express.urlencoded({ extended: true })); // Middleware para parsear cuerpos de solicitudes con URL-encoded

    const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const allowAll = allowedOriginsRaw.includes('*');
    const allowedOrigins = allowAll ? [] : allowedOriginsRaw; // vacío si es wildcard para simplificar la verificación

    // Si es wildcard, usar cors estándar con origin: true (refleja cualquier origin)
    // Si no, usar la función de whitelist
    app.use(cors(allowAll ? {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        credentials: true
    } : {
        origin: (origin, callback) => {
            // origin puede ser undefined (curl, same-origin)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origen no permitido: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        credentials: true
    })); // Habilita CORS para permitir solicitudes desde otros dominios

    const harvestRouter = harvestRouterFactory(db);
    app.use("/api/harvests", harvestRouter);

    const inventoryRouter = inventoryRouterFactory(db);
    app.use("/api/inventory", inventoryRouter);

    const lossesRouter = lossesRouterFactory(db);
    app.use("/api/losses", lossesRouter);

    const port = Number(process.env.APP_PORT) || 3000;
    const host = process.env.APP_HOST || "0.0.0.0"; // Escucha en todas las interfaces para entornos remotos

    app.set("trust proxy", true); // Permite que express detecte IP real si hay reverse proxy

    app.get("/", (req, res) => {
        res.status(200).json({ message: "API REST funcionando correctamente" });
    });

    server.listen(port, host, () => {
        console.log(`Servidor funcionando en ${host}:${port}`);
        const envRaw = process.env.ALLOWED_ORIGINS || '(no definido)';
        const corsMsg = allowAll ? '*' : (allowedOrigins.join(', ') || envRaw);
        console.log(`CORS permitido para: ${corsMsg}`);
    });
}
initServer(); // Inicia el servidor