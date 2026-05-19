import jwt from 'jsonwebtoken';

export const extractUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    req.user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (secret) {
            try {
                req.user = jwt.verify(token, secret);
            } catch {
                // Token inválido o expirado - req.user queda null
            }
        }
    }
    next();
};

export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            status: 401,
            error: 'Acceso denegado. Debes iniciar sesión.'
        });
    }
    next();
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                status: 401,
                error: 'Acceso denegado.'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                status: 403,
                error: 'No tienes permisos para esta acción.'
            });
        }
        next();
    };
};
