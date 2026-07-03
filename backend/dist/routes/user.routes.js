"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const CreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['admin', 'gestionnaire']).default('gestionnaire'),
});
const UpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(8).optional(),
    role: zod_1.z.enum(['admin', 'gestionnaire']).optional(),
});
// GET /api/users — admin only
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (_req, res) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(users);
});
// POST /api/users — admin only
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
        res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        return;
    }
    const hashed = await bcrypt_1.default.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
        data: { ...parsed.data, password: hashed },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
});
// PATCH /api/users/:id — admin only
router.patch('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = { ...parsed.data };
    if (parsed.data.password)
        data.password = await bcrypt_1.default.hash(parsed.data.password, 12);
    const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
});
// DELETE /api/users/:id — admin only, cannot delete self
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const self = req.user;
    if (self?.id === id) {
        res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
        return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Utilisateur supprimé.' });
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map