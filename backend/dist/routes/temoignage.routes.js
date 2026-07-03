"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const Schema = zod_1.z.object({
    nom: zod_1.z.string().min(2),
    role: zod_1.z.string().min(2),
    texte: zod_1.z.string().min(10),
    note: zod_1.z.number().int().min(1).max(5).default(5),
    actif: zod_1.z.boolean().default(true),
    ordre: zod_1.z.number().int().default(0),
});
// GET /api/temoignages — public (actifs uniquement)
router.get('/', async (_req, res) => {
    const data = await prisma.temoignage.findMany({
        where: { actif: true },
        orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(data);
});
// GET /api/temoignages/admin — tous (admin)
router.get('/admin', auth_middleware_1.authMiddleware, async (_req, res) => {
    const data = await prisma.temoignage.findMany({ orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }] });
    res.json(data);
});
// POST — admin
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const t = await prisma.temoignage.create({ data: parsed.data });
    res.status(201).json(t);
});
// PATCH — admin
router.patch('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = Schema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const t = await prisma.temoignage.update({ where: { id }, data: parsed.data });
    res.json(t);
});
// DELETE — admin
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res) => {
    await prisma.temoignage.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Supprimé.' });
});
exports.default = router;
//# sourceMappingURL=temoignage.routes.js.map