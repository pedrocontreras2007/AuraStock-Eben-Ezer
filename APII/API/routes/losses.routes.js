import express from 'express';
import LossesService from '../services/losses.services.js';
import { requireAuth } from '../middleware/userContext.js';
import { validateBody, lossSchema } from '../middleware/validate.js';

export default (db) => {
    const router = express.Router();
    const service = LossesService(db);

    router.get('/', requireAuth, async (req, res) => {
        const response = await service.findAll(req.tenantId, req.branchId);
        res.status(response.status).json(response);
    });

    router.post('/', requireAuth, validateBody(lossSchema), async (req, res) => {
        const response = await service.create(req.body, req.tenantId, req.branchId);
        res.status(response.status).json(response);
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        const response = await service.delete(req.params.id, req.tenantId);
        res.status(response.status).json(response);
    });

    return router;
};
