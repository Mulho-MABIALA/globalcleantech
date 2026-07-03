"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const CreateSchema = zod_1.z.object({
    candidatureId: zod_1.z.number().int(),
    demandeId: zod_1.z.number().int().optional(),
    dateDebut: zod_1.z.string().min(1),
    dateFin: zod_1.z.string().optional(),
    salaire: zod_1.z.string().max(100).optional(),
    notes: zod_1.z.string().optional(),
});
// GET /api/placements
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const where = {};
    if (search) {
        where.OR = [
            { candidature: { nomComplet: { contains: search, mode: 'insensitive' } } },
            { demande: { nomRaisonSociale: { contains: search, mode: 'insensitive' } } },
        ];
    }
    const [data, total] = await Promise.all([
        prisma.placement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                candidature: { select: { id: true, nomComplet: true, posteSouhaite: true, photoPath: true } },
                demande: { select: { id: true, nomRaisonSociale: true, serviceSouhaite: true } },
            },
        }),
        prisma.placement.count({ where }),
    ]);
    res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } });
});
// GET /api/placements/:id
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const p = await prisma.placement.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            candidature: true,
            demande: { select: { id: true, nomRaisonSociale: true, email: true, telephone: true, serviceSouhaite: true } },
        },
    });
    if (!p) {
        res.status(404).json({ message: 'Placement introuvable.' });
        return;
    }
    res.json(p);
});
// POST /api/placements
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { candidatureId, demandeId, dateDebut, dateFin, salaire, notes } = parsed.data;
    const placement = await prisma.$transaction(async (tx) => {
        const p = await tx.placement.create({
            data: {
                candidatureId,
                demandeId: demandeId ?? null,
                dateDebut: new Date(dateDebut),
                dateFin: dateFin ? new Date(dateFin) : null,
                salaire: salaire ?? null,
                notes: notes ?? null,
            },
            include: {
                candidature: { select: { id: true, nomComplet: true, posteSouhaite: true } },
                demande: { select: { id: true, nomRaisonSociale: true } },
            },
        });
        // Marquer la candidature comme placée
        await tx.candidature.update({ where: { id: candidatureId }, data: { statut: 'place' } });
        // Marquer la demande comme clôturée si liée
        if (demandeId) {
            await tx.demande.update({ where: { id: demandeId }, data: { statut: 'cloturee' } });
        }
        return p;
    });
    res.status(201).json(placement);
});
// PATCH /api/placements/:id
router.patch('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const { dateDebut, dateFin, salaire, notes, demandeId } = req.body;
    const p = await prisma.placement.update({
        where: { id },
        data: {
            ...(dateDebut && { dateDebut: new Date(dateDebut) }),
            ...(dateFin !== undefined && { dateFin: dateFin ? new Date(dateFin) : null }),
            ...(salaire !== undefined && { salaire }),
            ...(notes !== undefined && { notes }),
            ...(demandeId !== undefined && { demandeId: demandeId ?? null }),
        },
        include: {
            candidature: { select: { id: true, nomComplet: true, posteSouhaite: true } },
            demande: { select: { id: true, nomRaisonSociale: true } },
        },
    });
    res.json(p);
});
// DELETE /api/placements/:id
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    await prisma.placement.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Placement supprimé.' });
});
// GET /api/placements/candidature/:candidatureId
router.get('/candidature/:candidatureId', auth_middleware_1.authMiddleware, async (req, res) => {
    const data = await prisma.placement.findMany({
        where: { candidatureId: parseInt(req.params.candidatureId) },
        include: { demande: { select: { id: true, nomRaisonSociale: true, email: true, telephone: true } } },
        orderBy: { dateDebut: 'desc' },
    });
    res.json(data);
});
exports.default = router;
//# sourceMappingURL=placement.routes.js.map