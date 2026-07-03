"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Token manquant ou invalide.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.id, role: payload.role };
        next();
    }
    catch {
        res.status(401).json({ message: 'Token expiré ou invalide.' });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map