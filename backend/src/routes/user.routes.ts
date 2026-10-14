import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { AuthRequest, authMiddleware, requirePermission } from '../middlewares/auth.middleware'
import { PERMISSION_MODULES, defaultPermissions, isValidPermissionsMap } from '../utils/permissions'

const router = Router()
const prisma = new PrismaClient()

const PermissionsSchema = z
  .record(z.enum(['none', 'read', 'edit']))
  .refine(isValidPermissionsMap, { message: 'Permissions invalides.' })
  .optional()

const CreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'gestionnaire']).default('gestionnaire'),
  permissions: PermissionsSchema,
})

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'gestionnaire']).optional(),
  permissions: PermissionsSchema,
})

const USER_SELECT = { id: true, name: true, email: true, role: true, permissions: true, createdAt: true }

// GET /api/users
router.get('/', authMiddleware, requirePermission('utilisateurs', 'read'), async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: USER_SELECT,
  })
  res.json(users)
})

// GET /api/users/modules — liste des pages disponibles pour construire la matrice de permissions côté front
router.get('/modules', authMiddleware, requirePermission('utilisateurs', 'read'), (_req: AuthRequest, res: Response) => {
  res.json(PERMISSION_MODULES)
})

// POST /api/users
router.post('/', authMiddleware, requirePermission('utilisateurs', 'edit'), async (req: AuthRequest, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }

  // Seul un admin peut créer un autre admin (empêche l'escalade de privilèges par
  // un gestionnaire qui aurait reçu la permission de gérer les utilisateurs).
  if (parsed.data.role === 'admin' && req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Seul un administrateur peut créer un compte administrateur.' })
    return
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) { res.status(409).json({ message: 'Cet email est déjà utilisé.' }); return }

  const hashed = await bcrypt.hash(parsed.data.password, 12)
  const permissions = parsed.data.role === 'admin'
    ? undefined
    : (parsed.data.permissions ?? defaultPermissions())

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      password: hashed,
      ...(permissions ? { permissions } : {}),
    },
    select: USER_SELECT,
  })
  res.status(201).json(user)
})

// PATCH /api/users/:id
router.patch('/:id', authMiddleware, requirePermission('utilisateurs', 'edit'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }

  if (parsed.data.role === 'admin' && req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Seul un administrateur peut promouvoir un compte administrateur.' })
    return
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.password) data.password = await bcrypt.hash(parsed.data.password, 12)

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  })
  res.json(user)
})

// DELETE /api/users/:id — ne peut pas se supprimer soi-même
router.delete('/:id', authMiddleware, requirePermission('utilisateurs', 'edit'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  if (req.user?.id === id) { res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' }); return }
  await prisma.user.delete({ where: { id } })
  res.json({ message: 'Utilisateur supprimé.' })
})

export default router
