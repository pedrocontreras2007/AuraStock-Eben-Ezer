import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación JWT.
 * Verifica que el request incluya un Bearer Token válido en el header Authorization.
 * Si el token es válido, añade req.user con el payload decodificado.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            status: 401,
            error: 'Acceso denegado. Token no proporcionado.'
        });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error('❌ CRÍTICO: JWT_SECRET no está definido en las variables de entorno.');
        return res.status(500).json({
            success: false,
            status: 500,
            error: 'Error de configuración interna del servidor.'
        });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Adjunta el payload al request para uso en los controladores
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, status: 401, error: 'El token ha expirado.' });
        }
        return res.status(403).json({ success: false, status: 403, error: 'Token inválido.' });
    }
};
