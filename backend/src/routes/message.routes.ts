import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware'
import { sendMessageAdminMail } from '../services/mail.service'

const router = Router()
const prisma = new PrismaClient()

const CreateSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().optional(),
  sujet: z.string().min(3).max(200),
  corps: z.string().min(10),
})

// POST /api/messages — public
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ errors: parsed.error.flatten().fieldErrors })
    return
  }
  const msg = await prisma.message.create({ data: parsed.data })
  // Notification email async (ne bloque pas la réponse)
  sendMessageAdminMail(msg).catch(e => console.error('Mail message:', e))
  res.status(201).json({ message: 'Message envoyé.', id: msg.id })
})

// GET /api/messages — admin
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const statut = req.query.statut as string | undefined
  const search = req.query.search as string | undefined

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (search) where.OR = [
    { nom: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { sujet: { contains: search, mode: 'insensitive' } },
  ]

  const [data, total] = await Promise.all([
    prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.message.count({ where }),
  ])
  res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } })
})

// GET /api/messages/stats — non lus
router.get('/stats', authMiddleware, async (_req: Request, res: Response) => {
  const nonLus = await prisma.message.count({ where: { statut: 'non_lu' } })
  res.json({ nonLus })
})

// GET /api/messages/:id — admin
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const msg = await prisma.message.findUnique({ where: { id } })
  if (!msg) { res.status(404).json({ message: 'Message introuvable.' }); return }
  // Marquer comme lu automatiquement
  if (msg.statut === 'non_lu') await prisma.message.update({ where: { id }, data: { statut: 'lu' } })
  res.json({ ...msg, statut: msg.statut === 'non_lu' ? 'lu' : msg.statut })
})

// PATCH /api/messages/:id — admin
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { statut, noteAdmin } = req.body
  const msg = await prisma.message.update({ where: { id }, data: { statut, noteAdmin } })
  res.json(msg)
})

// DELETE /api/messages/:id — admin
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  await prisma.message.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Supprimé.' })
})

export default router
