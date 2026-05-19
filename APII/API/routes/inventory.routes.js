import express from 'express';
import InventoryService from '../services/inventory.services.js';
import { verifyToken } from '../middleware/auth.js';
import { validateBody, inventorySchema } from '../middleware/validate.js';

const router = express.Router();

export default (db) => {
    const service = InventoryService(db);

    // GET: Ver todo el inventario
    router.get('/', async (req, res) => {
        const response = await service.findAll();
        res.status(response.status).json(response);
    });

    // POST: Crear nuevo item (requiere auth + validación)
    router.post('/', verifyToken, validateBody(inventorySchema), async (req, res) => {
        const response = await service.create(req.body);
        res.status(response.status).json(response);
    });

    // PUT: Actualizar item (requiere auth + validación)
    router.put('/:id', verifyToken, validateBody(inventorySchema), async (req, res) => {
        const response = await service.update(req.params.id, req.body);
        res.status(response.status).json(response);
    });

    // DELETE: Borrar item (requiere auth)
    router.delete('/:id', verifyToken, async (req, res) => {
        const response = await service.delete(req.params.id);
        res.status(response.status).json(response);
    });

    return router;
}