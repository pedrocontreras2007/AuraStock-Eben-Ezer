import Joi from 'joi';

/**
 * Factory de middleware de validación de schema Joi.
 * Uso: router.post('/', validateBody(mySchema), handler)
 * @param {Joi.ObjectSchema} schema - Schema Joi para validar req.body
 */
export const validateBody = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,   // Devuelve TODOS los errores, no solo el primero
        stripUnknown: true,  // Descarta campos no declarados en el schema (seguridad extra)
        convert: true        // Permite coerciones seguras (ej. string "5" a número 5)
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

    req.body = value; // Reemplaza con los datos ya saneados por Joi
    next();
};

// ─── Schemas de Validación ───────────────────────────────────────────────────

export const harvestSchema = Joi.object({
    crop: Joi.string().trim().min(1).max(150).required().messages({
        'string.empty': 'El nombre del cultivo no puede estar vacío.',
        'any.required': 'El campo "crop" es obligatorio.'
    }),
    category: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'El campo "category" es obligatorio.'
    }),
    quantity: Joi.number().positive().required().messages({
        'number.base': '"quantity" debe ser un número.',
        'number.positive': '"quantity" debe ser un valor positivo.',
        'any.required': 'El campo "quantity" es obligatorio.'
    }),
    date: Joi.string().isoDate().optional().allow(null, ''),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByPartnerName: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, ''),
    purchasePriceClp: Joi.number().min(0).optional().allow(null),
    salePriceClp: Joi.number().min(0).optional().allow(null)
});

export const inventorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(150).required().messages({
        'any.required': 'El campo "name" es obligatorio.'
    }),
    category: Joi.string().trim().min(1).max(100).required(),
    quantity: Joi.number().min(0).required().messages({
        'number.base': '"quantity" debe ser un número.',
        'any.required': 'El campo "quantity" es obligatorio.'
    }),
    unit: Joi.string().trim().optional().allow(null, ''),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByPartnerName: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, '')
});

export const lossSchema = Joi.object({
    productName: Joi.string().trim().min(1).max(150).required().messages({
        'any.required': 'El campo "productName" es obligatorio.'
    }),
    quantity: Joi.number().positive().required().messages({
        'number.base': '"quantity" debe ser un número.',
        'number.positive': '"quantity" debe ser positivo.',
        'any.required': 'El campo "quantity" es obligatorio.'
    }),
    reason: Joi.string().trim().min(1).max(500).required().messages({
        'any.required': 'El campo "reason" es obligatorio.'
    }),
    date: Joi.string().isoDate().optional().allow(null, ''),
    recordedBy: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByPartnerName: Joi.string().trim().max(150).optional().allow(null, ''),
    recordedByUser: Joi.string().trim().email().optional().allow(null, ''),
    sourceType: Joi.string().valid('inventory', 'harvest').optional().allow(null, ''),
    sourceId: Joi.string().trim().optional().allow(null, '')
});
