"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const mail_service_1 = require("../services/mail.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const CreateSchema = zod_1.z.object({
    nom: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    telephone: zod_1.z.string().optional(),
    sujet: zod_1.z.string().min(3).max(200),
    corps: zod_1.z.string().min(10),
});
// POST /api/messages — public
router.post('/', async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const msg = await prisma.message.create({ data: parsed.data });
    // Notification email async (ne bloque pas la réponse)
    (0, mail_service_1.sendMessageAdminMail)(msg).catch(e => console.error('Mail message:', e));
    res.status(201).json({ message: 'Message envoyé.', id: msg.id });
});
// GET /api/messages — admin
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const statut = req.query.statut;
    const search = req.query.search;
    const where = {};
    if (statut)
        where.statut = statut;
    if (search)
        where.OR = [
            { nom: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { sujet: { contains: search, mode: 'insensitive' } },
        ];
    const [data, total] = await Promise.all([
        prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.message.count({ where }),
    ]);
    res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } });
});
// GET /api/messages/stats — non lus
router.get('/stats', auth_middleware_1.authMiddleware, async (_req, res) => {
    const nonLus = await prisma.message.count({ where: { statut: 'non_lu' } });
    res.json({ nonLus });
});
// GET /api/messages/:id — admin
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) {
        res.status(404).json({ message: 'Message introuvable.' });
        return;
    }
    // Marquer comme lu automatiquement
    if (msg.statut === 'non_lu')
        await prisma.message.update({ where: { id }, data: { statut: 'lu' } });
    res.json({ ...msg, statut: msg.statut === 'non_lu' ? 'lu' : msg.statut });
});
// PATCH /api/messages/:id — admin
router.patch('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const { statut, noteAdmin } = req.body;
    const msg = await prisma.message.update({ where: { id }, data: { statut, noteAdmin } });
    res.json(msg);
});
// DELETE /api/messages/:id — admin
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res) => {
    await prisma.message.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Supprimé.' });
});
exports.default = router;
//# sourceMappingURL=message.routes.js.map