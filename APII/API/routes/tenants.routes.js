import { Router } from 'express';
import tenantServiceFactory from '../services/tenants.services.js';

export default (db) => {
    const router = Router();
    const tenantService = tenantServiceFactory(db);

    router.get('/', async (req, res) => {
        const result = await tenantService.findAll();
        res.status(result.status).json(result);
    });

    router.get('/:slug', async (req, res) => {
        const result = await tenantService.findBySlug(req.params.slug);
        res.status(result.status).json(result);
    });

    router.post('/', async (req, res) => {
        const result = await tenantService.create(req.body);
        res.status(result.status).json(result);
    });

    router.put('/:id', async (req, res) => {
        const result = await tenantService.update(req.params.id, req.body);
        res.status(result.status).json(result);
    });

    router.delete('/:id', async (req, res) => {
        const result = await tenantService.delete(req.params.id);
        res.status(result.status).json(result);
    });

    return router;
};
