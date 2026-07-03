import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// GET /api/search?q=...
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim()
  if (q.length < 2) { res.json({ candidatures: [], demandes: [], messages: [] }); return }

  const mode = 'insensitive' as const

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
  ])

  res.json({ candidatures, demandes, messages })
})

export default router
