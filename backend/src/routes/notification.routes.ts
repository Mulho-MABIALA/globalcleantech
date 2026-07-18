import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware'
import { getVapidPublicKey, pushConfigured } from '../services/notification.service'

const router = Router()
const prisma = new PrismaClient()

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

// GET /api/notifications/vapid-public-key — public : nécessaire au navigateur avant abonnement
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: getVapidPublicKey(), configured: pushConfigured() })
})

// POST /api/notifications/subscribe — enregistre l'abonnement push du navigateur courant
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = SubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ message: 'Abonnement push invalide.', errors: parsed.error.errors })
    return
  }
  const { endpoint, keys } = parsed.data
  const userAgent = (req.headers['user-agent'] || '').slice(0, 255)

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.user!.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    create: { endpoint, userId: req.user!.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  })

  res.status(201).json({ message: 'Abonnement push enregistré.' })
})

// DELETE /api/notifications/subscribe — désabonnement (ex: bouton "désactiver" côté client)
router.delete('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint?: string }
  if (!endpoint) {
    res.status(400).json({ message: 'endpoint requis.' })
    return
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  res.json({ message: 'Désabonnement effectué.' })
})

// GET /api/notifications — liste paginée (cloche du dashboard)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.notification.count(),
  ])
  res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } })
})

// GET /api/notifications/stats — nombre de non-lues (badge de la cloche)
router.get('/stats', authMiddleware, async (_req: Request, res: Response) => {
  const nonLues = await prisma.notification.count({ where: { lu: false } })
  res.json({ nonLues })
})

// PATCH /api/notifications/read-all — tout marquer comme lu
router.patch('/read-all', authMiddleware, async (_req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { lu: false }, data: { lu: true } })
  res.json({ message: 'Toutes les notifications ont été marquées comme lues.' })
})

// PATCH /api/notifications/:id — marquer une notification comme lue
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const notif = await prisma.notification.update({ where: { id }, data: { lu: true } })
  res.json(notif)
})

export default router
