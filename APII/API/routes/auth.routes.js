import { Router } from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate.js';
import authServiceFactory from '../services/auth.services.js';

export default (db) => {
    const router = Router();
    const authService = authServiceFactory(db);

    const loginSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).required()
    });

    const registerSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        name: Joi.string().min(2).max(120).required(),
        tenantId: Joi.string().required(),
        branchId: Joi.string().optional().allow(null, ''),
        role: Joi.string().valid('admin', 'supervisor', 'operator').optional()
    });

    router.post('/login', validateBody(loginSchema), async (req, res) => {
        const result = await authService.login(req.body.email, req.body.password);
        res.status(result.status).json(result);
    });

    router.post('/register', validateBody(registerSchema), async (req, res) => {
        const result = await authService.register(req.body);
        res.status(result.status).json(result);
    });

    router.get('/tenants', async (req, res) => {
        const result = await authService.getTenants();
        res.status(result.status).json(result);
    });

    return router;
};
