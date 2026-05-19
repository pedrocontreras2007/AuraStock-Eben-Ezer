import express from 'express';
import LossesService from '../services/losses.services.js';
import { verifyToken } from '../middleware/auth.js';
import { validateBody, lossSchema } from '../middleware/validate.js';

const router = express.Router();

export default (db) => {
    const service = LossesService(db);

    // GET: Ver historial de pérdidas
    router.get('/', async (req, res) => {
        const response = await service.findAll();
        res.status(response.status).json(response);
    });

    // POST: Reportar nueva pérdida (requiere auth + validación)
    router.post('/', verifyToken, validateBody(lossSchema), async (req, res) => {
        const response = await service.create(req.body);
        res.status(response.status).json(response);
    });

    // DELETE: Borrar reporte (requiere auth)
    router.delete('/:id', verifyToken, async (req, res) => {
        const response = await service.delete(req.params.id);
        res.status(response.status).json(response);
    });

    return router;
}