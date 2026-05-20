import Joi from 'joi';

export const validateBody = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

    if (error) {
        const details = error.details.map(d => d.message);
        return res.status(422).json({
            success: false,
            status: 422,
            error: 'Datos de entrada inválidos.',
            details
        });
    }

    req.body = value;
    next();
};

export const produccionSchema = Joi.object({
    productName: Joi.string().trim().min(1).max(150).required(),
    category: Joi.string().valid('lote_masa', 'lote_relleno', 'lote_preparado', 'otro').required(),
    quantity: Joi.number().positive().required(),
    date: Joi.string().isoDate().optional().allow(null, ''),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, ''),
    notes: Joi.string().trim().max(500).optional().allow(null, '')
});

export const inventorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    category: Joi.string().valid('insumo', 'relleno', 'empaque', 'utensilio', 'otro').required(),
    quantity: Joi.string().allow('').required(),
    unit: Joi.string().trim().optional().allow(null, ''),
    minStock: Joi.number().min(0).optional().default(10),
    criticalStock: Joi.number().min(0).optional().default(5),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, '')
});

export const lossSchema = Joi.object({
    productName: Joi.string().trim().min(1).max(150).required(),
    quantity: Joi.number().positive().required(),
    reason: Joi.string().trim().min(1).max(500).required(),
    date: Joi.string().isoDate().optional().allow(null, ''),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, ''),
    sourceType: Joi.string().valid('inventory', 'produccion').optional().allow(null, ''),
    sourceId: Joi.string().trim().optional().allow(null, '')
});
