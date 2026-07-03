import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

const CreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'gestionnaire']).default('gestionnaire'),
})

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'gestionnaire']).optional(),
})

// GET /api/users — admin only
router.get('/', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.json(users)
})

// POST /api/users — admin only
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) { res.status(409).json({ message: 'Cet email est déjà utilisé.' }); return }

  const hashed = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: { ...parsed.data, password: hashed },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.status(201).json(user)
})

// PATCH /api/users/:id — admin only
router.patch('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.password) data.password = await bcrypt.hash(parsed.data.password, 12)

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.json(user)
})

// DELETE /api/users/:id — admin only, cannot delete self
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const self = (req as { user?: { id: number } }).user
  if (self?.id === id) { res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' }); return }
  await prisma.user.delete({ where: { id } })
  res.json({ message: 'Utilisateur supprimé.' })
})

export default router
