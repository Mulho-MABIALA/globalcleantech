import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/auth.middleware'
import { sendStatutUpdateMail, sendDemandeStatutUpdateMail } from '../services/mail.service'
import { createNotification } from '../services/notification.service'

const router = Router()
const prisma = new PrismaClient()

const POSTE_LABELS: Record<string, string> = {
  femme_menage: 'Femme de ménage', nounou: 'Nounou', cuisinier: 'Cuisinier(ère)',
  chauffeur: 'Chauffeur', gardien: 'Gardien', majordome: 'Majordome', autre: 'Autre',
}
const SERVICE_LABELS: Record<string, string> = {
  placement: 'Placement de personnel',
  impression: 'Impression / Photocopie',
  redaction: 'Rédaction / Communication',
  transfert: "Transfert d'argent",
  communication: 'Communication / Journalisme',
  autre: 'Autre',
}

const CreateSchema = z.object({
  candidatureId: z.number().int(),
  demandeId: z.number().int().optional(),
  dateDebut: z.string().min(1),
  dateFin: z.string().optional(),
  salaire: z.string().max(100).optional(),
  notes: z.string().optional(),
})

// GET /api/placements
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string | undefined

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { candidature: { nomComplet: { contains: search, mode: 'insensitive' } } },
      { demande: { nomRaisonSociale: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.placement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        candidature: { select: { id: true, nomComplet: true, posteSouhaite: true, photoPath: true } },
        demande: { select: { id: true, nomRaisonSociale: true, serviceSouhaite: true } },
      },
    }),
    prisma.placement.count({ where }),
  ])

  res.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } })
})

// GET /api/placements/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const p = await prisma.placement.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      candidature: true,
      demande: { select: { id: true, nomRaisonSociale: true, email: true, telephone: true, serviceSouhaite: true } },
    },
  })
  if (!p) { res.status(404).json({ message: 'Placement introuvable.' }); return }
  res.json(p)
})

// POST /api/placements
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten().fieldErrors }); return }

  const { candidatureId, demandeId, dateDebut, dateFin, salaire, notes } = parsed.data

  const { placement, candidatureInfo, demandeAvant } = await prisma.$transaction(async (tx) => {
    const p = await tx.placement.create({
      data: {
        candidatureId,
        demandeId: demandeId ?? null,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        salaire: salaire ?? null,
        notes: notes ?? null,
      },
      include: {
        candidature: { select: { id: true, nomComplet: true, posteSouhaite: true } },
        demande: { select: { id: true, nomRaisonSociale: true } },
      },
    })
    // Marquer la candidature comme placée
    const candidatureInfo = await tx.candidature.update({ where: { id: candidatureId }, data: { statut: 'place' } })
    // Marquer la demande comme clôturée si liée (on garde l'état d'avant pour savoir si ça a vraiment changé)
    let demandeAvant = null
    if (demandeId) {
      demandeAvant = await tx.demande.findUnique({ where: { id: demandeId } })
      await tx.demande.update({ where: { id: demandeId }, data: { statut: 'cloturee' } })
    }
    return { placement: p, candidatureInfo, demandeAvant }
  })

  // Notifier le candidat + l'équipe (même comportement qu'un changement de statut manuel)
  if (candidatureInfo?.email) {
    sendStatutUpdateMail({
      email: candidatureInfo.email,
      nom: candidatureInfo.nomComplet,
      statut: 'place',
      poste: POSTE_LABELS[candidatureInfo.posteSouhaite] ?? candidatureInfo.posteSouhaite,
      id: candidatureInfo.id,
    }).catch(() => {})
  }
  createNotification({
    type: 'candidature_statut',
    titre: 'Statut de candidature modifié',
    message: `${placement.candidature.nomComplet} → Placé(e)`,
    lien: `/admin/candidatures/${candidatureId}`,
  }).catch(() => {})

  if (demandeAvant && demandeAvant.statut !== 'cloturee' && demandeAvant.email) {
    sendDemandeStatutUpdateMail({
      email: demandeAvant.email,
      nom: demandeAvant.nomRaisonSociale,
      statut: 'cloturee',
      service: SERVICE_LABELS[demandeAvant.serviceSouhaite] ?? demandeAvant.serviceSouhaite,
      id: demandeAvant.id,
    }).catch(() => {})
    createNotification({
      type: 'demande_statut',
      titre: 'Statut de demande modifié',
      message: `${demandeAvant.nomRaisonSociale} → Clôturée`,
      lien: `/admin/demandes/${demandeAvant.id}`,
    }).catch(() => {})
  }

  res.status(201).json(placement)
})

// PATCH /api/placements/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { dateDebut, dateFin, salaire, notes, demandeId } = req.body
  const p = await prisma.placement.update({
    where: { id },
    data: {
      ...(dateDebut && { dateDebut: new Date(dateDebut) }),
      ...(dateFin !== undefined && { dateFin: dateFin ? new Date(dateFin) : null }),
      ...(salaire !== undefined && { salaire }),
      ...(notes !== undefined && { notes }),
      ...(demandeId !== undefined && { demandeId: demandeId ?? null }),
    },
    include: {
      candidature: { select: { id: true, nomComplet: true, posteSouhaite: true } },
      demande: { select: { id: true, nomRaisonSociale: true } },
    },
  })
  res.json(p)
})

// DELETE /api/placements/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const existing = await prisma.placement.findUnique({ where: { id } })
  if (!existing) { res.status(404).json({ message: 'Placement introuvable.' }); return }

  await prisma.$transaction(async (tx) => {
    await tx.placement.delete({ where: { id } })

    // Si c'était le seul/dernier placement de ce candidat, on remet la candidature "En cours"
    const remainingForCandidature = await tx.placement.count({ where: { candidatureId: existing.candidatureId } })
    if (remainingForCandidature === 0) {
      const candidature = await tx.candidature.findUnique({ where: { id: existing.candidatureId } })
      if (candidature?.statut === 'place') {
        await tx.candidature.update({ where: { id: existing.candidatureId }, data: { statut: 'en_cours' } })
      }
    }

    // Si la demande liée n'a plus aucun placement, on la rouvre "En traitement"
    if (existing.demandeId) {
      const remainingForDemande = await tx.placement.count({ where: { demandeId: existing.demandeId } })
      if (remainingForDemande === 0) {
        const demande = await tx.demande.findUnique({ where: { id: existing.demandeId } })
        if (demande?.statut === 'cloturee') {
          await tx.demande.update({ where: { id: existing.demandeId }, data: { statut: 'en_traitement' } })
        }
      }
    }
  })

  res.json({ message: 'Placement supprimé.' })
})

// GET /api/placements/candidature/:candidatureId
router.get('/candidature/:candidatureId', authMiddleware, async (req: Request, res: Response) => {
  const data = await prisma.placement.findMany({
    where: { candidatureId: parseInt(req.params.candidatureId) },
    include: { demande: { select: { id: true, nomRaisonSociale: true, email: true, telephone: true } } },
    orderBy: { dateDebut: 'desc' },
  })
  res.json(data)
})

export default router
