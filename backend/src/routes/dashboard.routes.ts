import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { getStats } from '../controllers/dashboard.controller'
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware'
import { mailConfigured, sendNewsletterMail } from '../services/mail.service'
import { uploadSiteImage } from '../middlewares/upload.middleware'

const router = Router()
const prisma = new PrismaClient()
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

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
router.get('/newsletter', requirePermission('newsletter', 'read'), async (req: Request, res: Response) => {
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

// POST /api/dashboard/newsletter/import-contacts — ajoute les emails des candidatures
// et demandes existantes qui ne sont pas encore dans la liste des abonnés (idempotent).
router.post('/newsletter/import-contacts', requirePermission('newsletter', 'edit'), async (_req: Request, res: Response) => {
  const [candidatures, demandes, existants] = await Promise.all([
    prisma.candidature.findMany({ where: { email: { not: null } }, select: { email: true, nomComplet: true } }),
    prisma.demande.findMany({ select: { email: true, nomRaisonSociale: true } }),
    prisma.newsletterSubscriber.findMany({ select: { email: true } }),
  ])
  const dejaAbonnes = new Set(existants.map(e => e.email))
  const candidats: { email: string; nom: string }[] = candidatures
    .filter((c): c is { email: string; nomComplet: string } => !!c.email)
    .map(c => ({ email: c.email, nom: c.nomComplet }))
  const clients = demandes
    .filter((d) => !!d.email)
    .map(d => ({ email: d.email, nom: d.nomRaisonSociale }))

  const aAjouter = new Map<string, string>()
  for (const c of [...candidats, ...clients]) {
    if (!dejaAbonnes.has(c.email) && !aAjouter.has(c.email)) aAjouter.set(c.email, c.nom)
  }

  let ajoutes = 0
  for (const [email, nom] of aAjouter) {
    await prisma.newsletterSubscriber.create({ data: { email, nom } }).catch(() => {})
    ajoutes++
  }

  res.json({ ajoutes, total: dejaAbonnes.size + ajoutes })
})

// PATCH /api/dashboard/newsletter/:id — activer/désactiver
router.patch('/newsletter/:id', requirePermission('newsletter', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { actif } = req.body as { actif: boolean }
  const updated = await prisma.newsletterSubscriber.update({ where: { id }, data: { actif } })
  res.json(updated)
})

// DELETE /api/dashboard/newsletter/:id
router.delete('/newsletter/:id', requirePermission('newsletter', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  await prisma.newsletterSubscriber.delete({ where: { id } })
  res.json({ message: 'Supprimé.' })
})

// GET /api/dashboard/newsletter/export — CSV export
router.get('/newsletter/export', requirePermission('newsletter', 'read'), async (_req: Request, res: Response) => {
  const subs = await prisma.newsletterSubscriber.findMany({
    where: { actif: true },
    orderBy: { createdAt: 'desc' },
  })
  const BOM = '﻿'
  const header = 'Email;Date inscription\n'
  const rows = subs.map(s =>
    `${s.email};${new Date(s.createdAt).toLocaleDateString('fr-FR')}`
  ).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter.csv"')
  res.send(BOM + header + rows)
})

// POST /api/dashboard/newsletter/send — envoyer une newsletter à tous les abonnés actifs
router.post('/newsletter/send', requirePermission('newsletter', 'edit'), async (req: Request, res: Response) => {
  const { sujet, contenu } = req.body as { sujet?: string; contenu?: string }
  if (!sujet?.trim() || !contenu?.trim()) {
    res.status(400).json({ message: 'Sujet et contenu requis.' })
    return
  }
  if (!mailConfigured()) {
    res.status(503).json({ message: 'Envoi impossible : SMTP non configuré (MAIL_HOST/MAIL_USER/MAIL_PASS dans le .env du backend).' })
    return
  }

  const subs = await prisma.newsletterSubscriber.findMany({
    where: { actif: true },
    orderBy: { createdAt: 'asc' },
  })
  if (subs.length === 0) {
    res.status(400).json({ message: 'Aucun abonné actif.' })
    return
  }

  let envoyes = 0
  const echecs: string[] = []
  for (const s of subs) {
    try {
      await sendNewsletterMail(s.email, sujet.trim(), contenu.trim())
      envoyes++
    } catch (e) {
      console.error(`[newsletter] Échec d'envoi à ${s.email}:`, e)
      echecs.push(s.email)
    }
  }

  res.json({
    message: echecs.length === 0
      ? `Newsletter envoyée à ${envoyes} abonné(s).`
      : `Envoyée à ${envoyes} abonné(s), ${echecs.length} échec(s).`,
    envoyes,
    echecs,
  })
})

// ── Actualités ───────────────────────────────────────────────────────────────

router.get('/actualites', requirePermission('actualites', 'read'), async (_req: Request, res: Response) => {
  const items = await prisma.actualite.findMany({ orderBy: { ordre: 'asc' } })
  res.json(items)
})

router.post('/actualites', requirePermission('actualites', 'edit'), async (req: Request, res: Response) => {
  const { titre, description, categorie, couleur, icone, lien, ordre } = req.body
  const item = await prisma.actualite.create({ data: { titre, description, categorie, couleur: couleur ?? 'emerald', icone: icone ?? 'star', lien: lien ?? null, ordre: ordre ?? 0 } })
  res.status(201).json(item)
})

router.put('/actualites/:id', requirePermission('actualites', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { titre, description, categorie, couleur, icone, lien, ordre, actif } = req.body
  const item = await prisma.actualite.update({ where: { id }, data: { titre, description, categorie, couleur, icone, lien, ordre, actif } })
  res.json(item)
})

router.delete('/actualites/:id', requirePermission('actualites', 'edit'), async (req: Request, res: Response) => {
  await prisma.actualite.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Supprimé.' })
})

// ── Services ─────────────────────────────────────────────────────────────────

router.get('/services', requirePermission('services', 'read'), async (_req: Request, res: Response) => {
  const services = await prisma.service.findMany({ orderBy: { ordre: 'asc' } })
  res.json(services)
})

router.post('/services', requirePermission('services', 'edit'), async (req: Request, res: Response) => {
  const { titre, description, emoji, couleur, tags, ordre } = req.body
  const service = await prisma.service.create({
    data: { titre, description, emoji: emoji || '⭐', couleur: couleur || 'emerald', tags: tags || '', ordre: ordre ?? 0 },
  })
  res.status(201).json(service)
})

router.put('/services/:id', requirePermission('services', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { titre, description, emoji, couleur, tags, ordre, actif } = req.body
  const service = await prisma.service.update({
    where: { id },
    data: { titre, description, emoji, couleur, tags, ordre, actif },
  })
  res.json(service)
})

router.delete('/services/:id', requirePermission('services', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  await prisma.service.delete({ where: { id } })
  res.json({ message: 'Supprimé.' })
})

// ── Contenu de site (À propos, etc.) ─────────────────────────────────────────

// GET /api/dashboard/content — tous les blocs de contenu
router.get('/content', requirePermission('contenu', 'read'), async (_req: Request, res: Response) => {
  const contents = await prisma.siteContent.findMany({ orderBy: { cle: 'asc' } })
  res.json(contents)
})

// PUT /api/dashboard/content/:cle — créer ou mettre à jour un bloc
router.put('/content/:cle', requirePermission('contenu', 'edit'), async (req: Request, res: Response) => {
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

// POST /api/dashboard/content/about-photo — remplace la photo de la page À propos
router.post('/content/about-photo', requirePermission('contenu', 'edit'), uploadSiteImage, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'Aucune image reçue.' })
    return
  }

  const previous = await prisma.siteContent.findUnique({ where: { cle: 'about_photo' } })

  const content = await prisma.siteContent.upsert({
    where: { cle: 'about_photo' },
    update: { valeur: req.file.filename },
    create: { cle: 'about_photo', valeur: req.file.filename },
  })

  if (previous?.valeur) {
    const oldFile = path.resolve(UPLOAD_DIR, 'site', previous.valeur)
    const siteDir = path.resolve(UPLOAD_DIR, 'site')
    if (oldFile.startsWith(siteDir + path.sep) && fs.existsSync(oldFile)) {
      try { fs.unlinkSync(oldFile) } catch { /* pas bloquant */ }
    }
  }

  res.json(content)
})

export default router
