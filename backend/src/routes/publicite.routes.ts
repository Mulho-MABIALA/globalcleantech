import { Router, Request, Response } from 'express'
import { PrismaClient, EmplacementPub, Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware'
import { uploadPubImage } from '../middlewares/upload.middleware'

// Gestion des espaces publicitaires (dashboard). Les routes publiques
// (affichage + comptage vues/clics) sont dans public.routes.ts.

const router = Router()
const prisma = new PrismaClient()
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'
const EMPLACEMENTS: EmplacementPub[] = ['accueil', 'popup', 'global']

router.use(authMiddleware)

function removeSiteImage(filename?: string | null) {
  if (!filename) return
  const siteDir = path.resolve(UPLOAD_DIR, 'site')
  const file = path.resolve(siteDir, filename)
  if (file.startsWith(siteDir + path.sep) && fs.existsSync(file)) {
    try { fs.unlinkSync(file) } catch { /* pas bloquant */ }
  }
}

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

const date = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// Les champs arrivent en multipart/form-data (chaînes) : on les normalise.
function parseBody(body: Record<string, unknown>): { data?: Prisma.PubliciteUncheckedCreateInput; error?: string } {
  const titre = str(body.titre, 150)
  if (!titre) return { error: 'Le titre est requis.' }

  const emplacement = (body.emplacement as EmplacementPub) || 'accueil'
  if (!EMPLACEMENTS.includes(emplacement)) return { error: 'Emplacement invalide.' }

  const lien = str(body.lien, 255)
  if (lien && !/^https?:\/\//i.test(lien) && !lien.startsWith('/')) {
    return { error: 'Le lien doit commencer par http(s):// ou /.' }
  }

  const dateDebut = date(body.dateDebut)
  const dateFin = date(body.dateFin)
  if (dateFin) dateFin.setHours(23, 59, 59, 999) // la pub reste visible toute la journée de fin
  if (dateDebut && dateFin && dateFin < dateDebut) return { error: 'La date de fin doit être après la date de début.' }

  return {
    data: {
      titre,
      description: str(body.description, 2000),
      annonceur: str(body.annonceur, 150),
      lien,
      texteBouton: str(body.texteBouton, 50),
      emplacement,
      dateDebut,
      dateFin,
      ordre: Number(body.ordre) || 0,
      actif: body.actif === undefined ? true : body.actif === true || body.actif === 'true',
    },
  }
}

// GET /api/publicites
router.get('/', requirePermission('publicites', 'read'), async (_req: Request, res: Response) => {
  const items = await prisma.publicite.findMany({ orderBy: [{ emplacement: 'asc' }, { ordre: 'asc' }, { createdAt: 'desc' }] })
  res.json(items)
})

// POST /api/publicites (multipart, champ fichier "image")
router.post('/', requirePermission('publicites', 'edit'), uploadPubImage, async (req: Request, res: Response) => {
  const { data, error } = parseBody(req.body)
  if (!data) {
    removeSiteImage(req.file?.filename)
    res.status(400).json({ message: error }); return
  }
  if (!req.file) {
    res.status(400).json({ message: 'Une image est requise pour la publicité.' }); return
  }
  const item = await prisma.publicite.create({ data: { ...data, imagePath: req.file.filename } })
  res.status(201).json(item)
})

// PUT /api/publicites/:id (multipart, image optionnelle)
router.put('/:id', requirePermission('publicites', 'edit'), uploadPubImage, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const existing = await prisma.publicite.findUnique({ where: { id } })
  if (!existing) {
    removeSiteImage(req.file?.filename)
    res.status(404).json({ message: 'Publicité introuvable.' }); return
  }
  const { data, error } = parseBody(req.body)
  if (!data) {
    removeSiteImage(req.file?.filename)
    res.status(400).json({ message: error }); return
  }
  const item = await prisma.publicite.update({
    where: { id },
    data: { ...data, ...(req.file ? { imagePath: req.file.filename } : {}) },
  })
  if (req.file) removeSiteImage(existing.imagePath)
  res.json(item)
})

// PATCH /api/publicites/:id/actif — afficher / masquer
router.patch('/:id/actif', requirePermission('publicites', 'edit'), async (req: Request, res: Response) => {
  const item = await prisma.publicite.update({
    where: { id: Number(req.params.id) },
    data: { actif: Boolean((req.body as { actif?: boolean }).actif) },
  })
  res.json(item)
})

// PATCH /api/publicites/:id/reset-stats — remet vues/clics à zéro
router.patch('/:id/reset-stats', requirePermission('publicites', 'edit'), async (req: Request, res: Response) => {
  const item = await prisma.publicite.update({ where: { id: Number(req.params.id) }, data: { vues: 0, clics: 0 } })
  res.json(item)
})

// DELETE /api/publicites/:id
router.delete('/:id', requirePermission('publicites', 'edit'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const existing = await prisma.publicite.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ message: 'Publicité introuvable.' }); return }
  await prisma.publicite.delete({ where: { id } })
  removeSiteImage(existing.imagePath)
  res.json({ message: 'Supprimé.' })
})

export default router
