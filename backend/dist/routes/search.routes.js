"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/search?q=...
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
        res.json({ candidatures: [], demandes: [], messages: [] });
        return;
    }
    const mode = 'insensitive';
    const [candidatures, demandes, messages] = await Promise.all([
        prisma.candidature.findMany({
            where: {
                OR: [
                    { nomComplet: { contains: q, mode } },
                    { telephone: { contains: q, mode } },
                    { email: { contains: q, mode } },
                    { ville: { contains: q, mode } },
                ],
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, nomComplet: true, posteSouhaite: true, ville: true, statut: true },
        }),
        prisma.demande.findMany({
            where: {
                OR: [
                    { nomRaisonSociale: { contains: q, mode } },
                    { email: { contains: q, mode } },
                    { telephone: { contains: q, mode } },
                ],
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, nomRaisonSociale: true, serviceSouhaite: true, statut: true },
        }),
        prisma.message.findMany({
            where: {
                OR: [
                    { nom: { contains: q, mode } },
                    { email: { contains: q, mode } },
                    { sujet: { contains: q, mode } },
                ],
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, nom: true, sujet: true, statut: true },
        }),
    ]);
    res.json({ candidatures, demandes, messages });
});
exports.default = router;
//# sourceMappingURL=search.routes.js.map