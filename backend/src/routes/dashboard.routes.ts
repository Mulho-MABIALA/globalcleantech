import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { getStats } from '../controllers/dashboard.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)
router.get('/stats', getStats)

// GET /api/dashboard/rapport-mensuel?mois=2026-06
router.get('/rapport-mensuel', async (req: Request, res: Response) => {
  const moisParam = req.query.mois as string
  let debut: Date, fin: Date

  if (moisParam && /^\d{4}-\d{2}$/.test(moisParam)) {
    const [y, m] = moisParam.split('-').map(Number)
    debut = new Date(y, m - 1, 1)
    fin = new Date(y, m, 1)
  } else {
    const now = new Date()
    debut = new Date(now.getFullYear(), now.getMonth(), 1)
    fin = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  const [
    candidatures, demandesTotal, placements,
    messagesTotal, candidaturesParStatut, demandesParService,
    topPostes,
  ] = await Promise.all([
    prisma.candidature.count({ where: { createdAt: { gte: debut, lt: fin } } }),
    prisma.demande.count({ where: { createdAt: { gte: debut, lt: fin } } }),
    prisma.placement.count({ where: { createdAt: { gte: debut, lt: fin } } }),
    prisma.message.count({ where: { createdAt: { gte: debut, lt: fin } } }),
    prisma.candidature.groupBy({ by: ['statut'], where: { createdAt: { gte: debut, lt: fin } }, _count: { _all: true } }),
    prisma.demande.groupBy({ by: ['serviceSouhaite'], where: { createdAt: { gte: debut, lt: fin } }, _count: { _all: true } }),
    prisma.candidature.groupBy({ by: ['posteSouhaite'], where: { createdAt: { gte: debut, lt: fin } }, _count: { _all: true }, orderBy: { _count: { posteSouhaite: 'desc' } }, take: 5 }),
  ])

  const par_statut: Record<string, number> = {}
  candidaturesParStatut.forEach(g => { par_statut[g.statut] = g._count._all })

  const par_service: Record<string, number> = {}
  demandesParService.forEach(g => { par_service[g.serviceSouhaite] = g._count._all })

  const top_postes = topPostes.map(g => ({ poste: g.posteSouhaite, count: g._count._all }))

  res.json({
    mois: debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    periode: { debut: debut.toISOString(), fin: fin.toISOString() },
    candidatures, demandes: demandesTotal, placements, messages: messagesTotal,
    par_statut, par_service, top_postes,
  })
})

// GET /api/dashboard/rapport-mensuel/csv
router.get('/rapport-mensuel/csv', async (req: Request, res: Response) => {
  const moisParam = req.query.mois as string
  let debut: Date, fin: Date
  if (moisParam && /^\d{4}-\d{2}$/.test(moisParam)) {
    const [y, m] = moisParam.split('-').map(Number)
    debut = new Date(y, m - 1, 1); fin = new Date(y, m, 1)
  } else {
    const now = new Date()
    debut = new Date(now.getFullYear(), now.getMonth(), 1)
    fin = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  const placements = await prisma.placement.findMany({
    where: { createdAt: { gte: debut, lt: fin } },
    include: {
      candidature: { select: { nomComplet: true, posteSouhaite: true, telephone: true } },
      demande: { select: { nomRaisonSociale: true } },
    },
    orderBy: { dateDebut: 'asc' },
  })

  const BOM = '﻿'
  const header = 'ID;Candidat;Poste;Téléphone;Client;Date début;Date fin;Salaire\n'
  const rows = placements.map(p =>
    `${p.id};${p.candidature.nomComplet};${p.candidature.posteSouhaite};${p.candidature.telephone};${p.demande?.nomRaisonSociale ?? ''};${new Date(p.dateDebut).toLocaleDateString('fr-FR')};${p.dateFin ? new Date(p.dateFin).toLocaleDateString('fr-FR') : ''};${p.salaire ?? ''}`
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="placements-${moisParam || 'mois'}.csv"`)
  res.send(BOM + header + rows)
})

// ── Newsletter admin ──────────────────────────────────────────────────────────

// GET /api/dashboard/newsletter — liste des abonnés
router.get('/newsletter', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Number(req.query.limit) || 25
  const actif = req.query.actif === 'false' ? false : true
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { actif },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({ where: { actif } }),
  ])
  res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } })
})

// PATCH /api/dashboard/newsletter/:id — activer/désactiver
router.patch('/newsletter/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { actif } = req.body as { actif: boolean }
  const updated = await prisma.newsletterSubscriber.update({ where: { id }, data: { actif } })
  res.json(updated)
})

// DELETE /api/dashboard/newsletter/:id
router.delete('/newsletter/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  await prisma.newsletterSubscriber.delete({ where: { id } })
  res.json({ message: 'Supprimé.' })
})

// GET /api/dashboard/newsletter/export — CSV export
router.get('/newsletter/export', async (_req: Request, res: Response) => {
  const subs = await prisma.newsletterSubscriber.findMany({
    where: { actif: true },
    orderBy: { createdAt: 'desc' },
  })
  const BOM = '﻿'
  const header = 'Email;Nom;Date inscription\n'
  const rows = subs.map(s =>
    `${s.email};${s.nom ?? ''};${new Date(s.createdAt).toLocaleDateString('fr-FR')}`
  ).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter.csv"')
  res.send(BOM + header + rows)
})

// ── Actualités ───────────────────────────────────────────────────────────────

router.get('/actualites', async (_req: Request, res: Response) => {
  const items = await prisma.actualite.findMany({ orderBy: { ordre: 'asc' } })
  res.json(items)
})

router.post('/actualites', async (req: Request, res: Response) => {
  const { titre, description, categorie, couleur, icone, lien, ordre } = req.body
  const item = await prisma.actualite.create({ data: { titre, description, categorie, couleur: couleur ?? 'emerald', icone: icone ?? 'star', lien: lien ?? null, ordre: ordre ?? 0 } })
  res.status(201).json(item)
})

router.put('/actualites/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { titre, description, categorie, couleur, icone, lien, ordre, actif } = req.body
  const item = await prisma.actualite.update({ where: { id }, data: { titre, description, categorie, couleur, icone, lien, ordre, actif } })
  res.json(item)
})

router.delete('/actualites/:id', async (req: Request, res: Response) => {
  await prisma.actualite.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Supprimé.' })
})

// ── Services ─────────────────────────────────────────────────────────────────

router.get('/services', async (_req: Request, res: Response) => {
  const services = await prisma.service.findMany({ orderBy: { ordre: 'asc' } })
  res.json(services)
})

router.post('/services', async (req: Request, res: Response) => {
  const { titre, description, emoji, couleur, tags, ordre } = req.body
  const service = await prisma.service.create({
    data: { titre, description, emoji: emoji || '⭐', couleur: couleur || 'emerald', tags: tags || '', ordre: ordre ?? 0 },
  })
  res.status(201).json(service)
})

router.put('/services/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { titre, description, emoji, couleur, tags, ordre, actif } = req.body
  const service = await prisma.service.update({
    where: { id },
    data: { titre, description, emoji, couleur, tags, ordre, actif },
  })
  res.json(service)
})

router.delete('/services/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  await prisma.service.delete({ where: { id } })
  res.json({ message: 'Supprimé.' })
})

// ── Contenu de site (À propos, etc.) ─────────────────────────────────────────

// GET /api/dashboard/content — tous les blocs de contenu
router.get('/content', async (_req: Request, res: Response) => {
  const contents = await prisma.siteContent.findMany({ orderBy: { cle: 'asc' } })
  res.json(contents)
})

// PUT /api/dashboard/content/:cle — créer ou mettre à jour un bloc
router.put('/content/:cle', async (req: Request, res: Response) => {
  const { cle } = req.params
  const { valeur } = req.body as { valeur: string }
  if (typeof valeur !== 'string') {
    res.status(400).json({ message: 'valeur requis.' })
    return
  }
  const content = await prisma.siteContent.upsert({
    where: { cle },
    update: { valeur },
    create: { cle, valeur },
  })
  res.json(content)
})

export default router
