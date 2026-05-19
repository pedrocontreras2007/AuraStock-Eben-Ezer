import express from 'express';
import InventoryService from '../services/inventory.services.js';
import { requireAuth } from '../middleware/userContext.js';
import { validateBody, inventorySchema } from '../middleware/validate.js';

export default (db) => {
    const router = express.Router();
    const service = InventoryService(db);

    router.get('/', async (req, res) => {
        const response = await service.findAll(req.tenantId, req.branchId);
        res.status(response.status).json(response);
    });

    router.post('/', requireAuth, validateBody(inventorySchema), async (req, res) => {
        const response = await service.create(req.body, req.tenantId, req.branchId);
        res.status(response.status).json(response);
    });

    router.put('/:id', requireAuth, validateBody(inventorySchema), async (req, res) => {
        const response = await service.update(req.params.id, req.body, req.tenantId);
        res.status(response.status).json(response);
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        const response = await service.delete(req.params.id, req.tenantId);
        res.status(response.status).json(response);
    });

    return router;
};
