import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { AuthRequest } from '../middlewares/auth.middleware'
import { CandidatureSchema, UpdateCandidatureSchema } from '../schemas/candidature.schema'
import { sendCandidatureAdminMail, sendStatutUpdateMail, sendCandidatureAfficheMail } from '../services/mail.service'
import { createNotification } from '../services/notification.service'

const POSTE_LABELS: Record<string, string> = {
  femme_menage: 'Femme de ménage', nounou: 'Nounou', cuisinier: 'Cuisinier(ère)',
  chauffeur: 'Chauffeur', gardien: 'Gardien', majordome: 'Majordome', autre: 'Autre',
}

const STATUT_LABELS: Record<string, string> = {
  a_traiter: 'À traiter', en_cours: 'En cours', place: 'Placé(e)', archive: 'Archivé(e)',
}

const prisma = new PrismaClient()
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

export async function createCandidature(req: AuthRequest, res: Response) {
  const parsed = CandidatureSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({
      message: 'Données invalides.',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  const files = req.files as Record<string, Express.Multer.File[]> | undefined

  const candidature = await prisma.candidature.create({
    data: {
      nomComplet: parsed.data.nomComplet,
      dateNaissance: new Date(parsed.data.dateNaissance),
      telephone: parsed.data.telephone,
      email: parsed.data.email || null,
      ville: parsed.data.ville,
      posteSouhaite: parsed.data.posteSouhaite,
      experience: parsed.data.experience,
      description: parsed.data.description || null,
      disponibilite: parsed.data.disponibilite,
      dateDisponibilite: parsed.data.dateDisponibilite ? new Date(parsed.data.dateDisponibilite) : null,
    },
  })

  let cvPath: string | null = null
  let photoPath: string | null = null
  let cniRectoPath: string | null = null
  let cniVersoPath: string | null = null

  if (files) {
    const destDir = path.join(UPLOAD_DIR, 'candidatures', String(candidature.id))
    fs.mkdirSync(destDir, { recursive: true })

    const saveFile = (f: Express.Multer.File) => {
      const dest = path.join(destDir, f.filename)
      fs.renameSync(f.path, dest)
      return path.join('candidatures', String(candidature.id), f.filename)
    }

    if (files.cv?.[0]) cvPath = saveFile(files.cv[0])
    if (files.photo?.[0]) photoPath = saveFile(files.photo[0])
    if (files.cniRecto?.[0]) cniRectoPath = saveFile(files.cniRecto[0])
    if (files.cniVerso?.[0]) cniVersoPath = saveFile(files.cniVerso[0])

    if (cvPath || photoPath || cniRectoPath || cniVersoPath) {
      await prisma.candidature.update({
        where: { id: candidature.id },
        data: { cvPath, photoPath, cniRectoPath, cniVersoPath },
      })
    }
  }

  try {
    await sendCandidatureAdminMail({
      id: candidature.id,
      nomComplet: candidature.nomComplet,
      telephone: candidature.telephone,
      email: candidature.email,
      ville: candidature.ville,
      posteSouhaite: candidature.posteSouhaite,
      experience: candidature.experience,
    })
  } catch (err) {
    console.error('Email admin candidature non envoyé :', err)
  }

  createNotification({
    type: 'candidature',
    titre: 'Nouvelle candidature',
    message: `${candidature.nomComplet} — ${POSTE_LABELS[candidature.posteSouhaite] ?? candidature.posteSouhaite} (${candidature.ville})`,
    lien: `/admin/candidatures/${candidature.id}`,
  }).catch(() => {})

  res.status(201).json({ ...candidature, cvPath, photoPath, cniRectoPath, cniVersoPath })
}

export async function listCandidatures(req: AuthRequest, res: Response) {
  const { statut, poste, search, page = '1', limit = '20' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (poste) where.posteSouhaite = poste
  if (search) {
    where.OR = [
      { nomComplet: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search } },
    ]
  }

  const [total, items] = await Promise.all([
    prisma.candidature.count({ where }),
    prisma.candidature.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  res.json({
    data: items,
    meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  })
}

export async function getCandidature(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const candidature = await prisma.candidature.findUnique({ where: { id } })
  if (!candidature) {
    res.status(404).json({ message: 'Candidature introuvable.' })
    return
  }
  res.json(candidature)
}

export async function updateCandidature(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const parsed = UpdateCandidatureSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ message: 'Données invalides.', errors: parsed.error.errors })
    return
  }

  const prev = await prisma.candidature.findUnique({ where: { id } })
  const updated = await prisma.candidature.update({ where: { id }, data: parsed.data })

  // Notify candidate by email when status changes
  if (parsed.data.statut && prev && parsed.data.statut !== prev.statut) {
    if (updated.email) {
      sendStatutUpdateMail({
        email: updated.email,
        nom: updated.nomComplet,
        statut: updated.statut,
        poste: POSTE_LABELS[updated.posteSouhaite] ?? updated.posteSouhaite,
        id: updated.id,
      }).catch(() => {})
    }

    // Notification interne + push pour l'équipe (visibilité sur les changements de statut)
    createNotification({
      type: 'candidature_statut',
      titre: 'Statut de candidature modifié',
      message: `${updated.nomComplet} → ${STATUT_LABELS[updated.statut] ?? updated.statut}`,
      lien: `/admin/candidatures/${updated.id}`,
    }).catch(() => {})
  }

  res.json(updated)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Reçoit l'affiche générée côté frontend (PNG en dataURL, signée par
 * l'administrateur) et l'envoie par email au destinataire choisi
 * (candidat ou client).
 */
export async function sendCandidatureAffiche(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const { email, image } = req.body as { email?: string; image?: string }

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ message: 'Adresse email destinataire invalide.' })
    return
  }
  if (!image || !image.startsWith('data:image/')) {
    res.status(400).json({ message: 'Image invalide.' })
    return
  }

  const candidature = await prisma.candidature.findUnique({ where: { id } })
  if (!candidature) {
    res.status(404).json({ message: 'Candidature introuvable.' })
    return
  }

  const base64 = image.split(',')[1] || ''
  const imageBuffer = Buffer.from(base64, 'base64')
  if (imageBuffer.length === 0) {
    res.status(400).json({ message: 'Image invalide.' })
    return
  }

  try {
    await sendCandidatureAfficheMail({
      to: email,
      nomComplet: candidature.nomComplet,
      poste: POSTE_LABELS[candidature.posteSouhaite] ?? candidature.posteSouhaite,
      imageBuffer,
    })
    res.json({ message: 'Affiche envoyée par email.' })
  } catch (err) {
    console.error("Erreur envoi de l'affiche :", err)
    res.status(502).json({ message: "Échec de l'envoi de l'email (SMTP non configuré ou indisponible)." })
  }
}

export async function deleteCandidature(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)

  const candidature = await prisma.candidature.findUnique({ where: { id } })
  if (!candidature) {
    res.status(404).json({ message: 'Candidature introuvable.' })
    return
  }

  const dir = path.join(UPLOAD_DIR, 'candidatures', String(id))
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })

  await prisma.candidature.delete({ where: { id } })
  res.status(204).send()
}

export async function exportCandidaturesCsv(req: AuthRequest, res: Response) {
  const candidatures = await prisma.candidature.findMany({ orderBy: { createdAt: 'desc' } })

  const headers = [
    'ID', 'Nom complet', 'Date naissance', 'Téléphone', 'Email',
    'Ville', 'Poste souhaité', 'Expérience', 'Disponibilité', 'Statut', 'Date de dépôt',
  ]

  const rows = candidatures.map((c) => [
    c.id,
    c.nomComplet,
    c.dateNaissance.toISOString().split('T')[0],
    c.telephone,
    c.email || '',
    c.ville,
    c.posteSouhaite,
    c.experience,
    c.disponibilite,
    c.statut,
    c.createdAt.toISOString(),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="candidatures.csv"')
  res.send('﻿' + csv)
}

export async function serveUpload(req: AuthRequest, res: Response) {
  const { folder, filename } = req.params
  const filePath = path.resolve(UPLOAD_DIR, folder, filename)

  if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
    res.status(403).json({ message: 'Accès refusé.' })
    return
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'Fichier introuvable.' })
    return
  }

  res.sendFile(filePath)
}
