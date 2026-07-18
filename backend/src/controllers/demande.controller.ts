import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'
import { DemandeSchema, UpdateDemandeSchema } from '../schemas/demande.schema'
import { sendDemandeAdminMail, sendDemandeConfirmationMail } from '../services/mail.service'
import { createNotification } from '../services/notification.service'

const prisma = new PrismaClient()

export async function createDemande(req: Request, res: Response) {
  const parsed = DemandeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({
      message: 'Données invalides.',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  const data = parsed.data
  const demande = await prisma.demande.create({
    data: {
      nomRaisonSociale: data.nomRaisonSociale,
      typeDemandeur: data.typeDemandeur,
      telephone: data.telephone,
      email: data.email,
      serviceSouhaite: data.serviceSouhaite,
      posteRecherche: data.posteRecherche || null,
      nombrePersonnes: data.nombrePersonnes ? Number(data.nombrePersonnes) : null,
      description: data.description,
      budgetEstime: data.budgetEstime || null,
      dateSouhaitee: data.dateSouhaitee ? new Date(data.dateSouhaitee) : null,
    },
  })

  const services: Record<string, string> = {
    placement: 'Placement de personnel',
    impression: 'Impression / Photocopie',
    redaction: 'Rédaction / Communication',
    transfert: "Transfert d'argent",
    communication: 'Communication / Journalisme',
    autre: 'Autre',
  }

  try {
    await sendDemandeAdminMail({
      id: demande.id,
      nomRaisonSociale: demande.nomRaisonSociale,
      telephone: demande.telephone,
      email: demande.email,
      serviceSouhaite: demande.serviceSouhaite,
      description: demande.description,
    })
    await sendDemandeConfirmationMail(
      demande.email,
      demande.nomRaisonSociale,
      services[demande.serviceSouhaite] || demande.serviceSouhaite
    )
  } catch (err) {
    console.error('Email demande non envoyé :', err)
  }

  createNotification({
    type: 'demande',
    titre: 'Nouvelle demande client',
    message: `${demande.nomRaisonSociale} — ${services[demande.serviceSouhaite] || demande.serviceSouhaite}`,
    lien: `/admin/demandes/${demande.id}`,
  }).catch(() => {})

  res.status(201).json(demande)
}

export async function listDemandes(req: AuthRequest, res: Response) {
  const { statut, service, search, page = '1', limit = '20' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (service) where.serviceSouhaite = service
  if (search) {
    where.OR = [
      { nomRaisonSociale: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search } },
    ]
  }

  const [total, items] = await Promise.all([
    prisma.demande.count({ where }),
    prisma.demande.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
  ])

  res.json({
    data: items,
    meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  })
}

export async function getDemande(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const demande = await prisma.demande.findUnique({ where: { id } })
  if (!demande) {
    res.status(404).json({ message: 'Demande introuvable.' })
    return
  }
  res.json(demande)
}

export async function updateDemande(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const parsed = UpdateDemandeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ message: 'Données invalides.', errors: parsed.error.errors })
    return
  }
  const updated = await prisma.demande.update({ where: { id }, data: parsed.data })
  res.json(updated)
}

export async function deleteDemande(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id)
  const demande = await prisma.demande.findUnique({ where: { id } })
  if (!demande) {
    res.status(404).json({ message: 'Demande introuvable.' })
    return
  }
  await prisma.demande.delete({ where: { id } })
  res.status(204).send()
}

export async function exportDemandesCsv(req: AuthRequest, res: Response) {
  const demandes = await prisma.demande.findMany({ orderBy: { createdAt: 'desc' } })

  const headers = [
    'ID', 'Nom/Raison sociale', 'Type demandeur', 'Téléphone', 'Email',
    'Service souhaité', 'Poste recherché', 'Nb personnes', 'Budget estimé',
    'Date souhaitée', 'Statut', 'Date de soumission',
  ]

  const rows = demandes.map((d) => [
    d.id,
    d.nomRaisonSociale,
    d.typeDemandeur,
    d.telephone,
    d.email,
    d.serviceSouhaite,
    d.posteRecherche || '',
    d.nombrePersonnes ?? '',
    d.budgetEstime || '',
    d.dateSouhaitee ? d.dateSouhaitee.toISOString().split('T')[0] : '',
    d.statut,
    d.createdAt.toISOString(),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="demandes.csv"')
  res.send('﻿' + csv)
}
