import express from 'express';
import HarvestService from '../services/harvest.services.js';
import { verifyToken } from '../middleware/auth.js';
import { validateBody, harvestSchema } from '../middleware/validate.js';

const router = express.Router();

export default (db) => {
    const service = HarvestService(db);

    // GET: Obtener historial
    router.get('/', async (req, res) => {
        const response = await service.findAll();
        res.status(response.status).json(response);
    });

    // POST: Registrar nueva cosecha (requiere auth + validación)
    router.post('/', verifyToken, validateBody(harvestSchema), async (req, res) => {
        const response = await service.create(req.body);
        res.status(response.status).json(response);
    });

    // PUT: Actualizar registro existente (requiere auth + validación)
    router.put('/:id', verifyToken, validateBody(harvestSchema), async (req, res) => {
        const response = await service.update(req.params.id, req.body);
        res.status(response.status).json(response);
    });

    // DELETE: Borrar registro por ID (requiere auth)
    router.delete('/:id', verifyToken, async (req, res) => {
        const response = await service.delete(req.params.id);
        res.status(response.status).json(response);
    });

    return router;
}