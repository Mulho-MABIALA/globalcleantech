import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

const Schema = z.object({
  nom: z.string().min(2),
  role: z.string().min(2),
  texte: z.string().min(10),
  note: z.number().int().min(1).max(5).default(5),
  actif: z.boolean().default(true),
  ordre: z.number().int().default(0),
})

// GET /api/temoignages — public (actifs uniquement)
router.get('/', async (_req: Request, res: Response) => {
  const data = await prisma.temoignage.findMany({
    where: { actif: true },
    orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
  })
  res.json(data)
})

// GET /api/temoignages/admin — tous (admin)
router.get('/admin', authMiddleware, async (_req: Request, res: Response) => {
  const data = await prisma.temoignage.findMany({ orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }] })
  res.json(data)
})

// POST — admin
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const parsed = Schema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }
  const t = await prisma.temoignage.create({ data: parsed.data })
  res.status(201).json(t)
})

// PATCH — admin
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const parsed = Schema.partial().safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }
  const t = await prisma.temoignage.update({ where: { id }, data: parsed.data })
  res.json(t)
})

// DELETE — admin
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  await prisma.temoignage.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Supprimé.' })
})

export default router
