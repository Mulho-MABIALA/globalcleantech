import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'

const prisma = new PrismaClient()

export async function getStats(_req: AuthRequest, res: Response) {
  const now = new Date()
  const sept_jours = new Date(); sept_jours.setDate(now.getDate() - 7)
  const trente_jours = new Date(); trente_jours.setDate(now.getDate() - 30)
  const soixante_jours = new Date(); soixante_jours.setDate(now.getDate() - 60)

  const [
    totalCandidatures, nouvellesCandidatures7j, candidaturesATraiter,
    candidaturesParPoste, candidaturesParStatut,
    totalDemandes, nouvellesDemandes7j, demandesNouvelles,
    demandesParService,
    totalMessages, messagesNonLus, nouveauxMessages7j,
    dernieresCandidatures, dernieresDemandes, derniersMessages,
    // Tendance 30j vs 30j précédents
    candidatures30j, candidaturesPrev30j,
    demandes30j, demandesPrev30j,
    messages30j, messagesPrev30j,
  ] = await prisma.$transaction([
    prisma.candidature.count(),
    prisma.candidature.count({ where: { createdAt: { gte: sept_jours } } }),
    prisma.candidature.count({ where: { statut: 'a_traiter' } }),
    prisma.candidature.groupBy({ by: ['posteSouhaite'], _count: { _all: true }, orderBy: { _count: { posteSouhaite: 'desc' } } }),
    prisma.candidature.groupBy({ by: ['statut'], _count: { _all: true }, orderBy: { _count: { statut: 'desc' } } }),
    prisma.demande.count(),
    prisma.demande.count({ where: { createdAt: { gte: sept_jours } } }),
    prisma.demande.count({ where: { statut: 'nouvelle' } }),
    prisma.demande.groupBy({ by: ['serviceSouhaite'], _count: { _all: true }, orderBy: { _count: { serviceSouhaite: 'desc' } } }),
    prisma.message.count(),
    prisma.message.count({ where: { statut: 'non_lu' } }),
    prisma.message.count({ where: { createdAt: { gte: sept_jours } } }),
    prisma.candidature.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      select: { id: true, nomComplet: true, posteSouhaite: true, ville: true, statut: true, createdAt: true },
    }),
    prisma.demande.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      select: { id: true, nomRaisonSociale: true, serviceSouhaite: true, statut: true, createdAt: true },
    }),
    prisma.message.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      select: { id: true, nom: true, sujet: true, statut: true, createdAt: true },
    }),
    prisma.candidature.count({ where: { createdAt: { gte: trente_jours } } }),
    prisma.candidature.count({ where: { createdAt: { gte: soixante_jours, lt: trente_jours } } }),
    prisma.demande.count({ where: { createdAt: { gte: trente_jours } } }),
    prisma.demande.count({ where: { createdAt: { gte: soixante_jours, lt: trente_jours } } }),
    prisma.message.count({ where: { createdAt: { gte: trente_jours } } }),
    prisma.message.count({ where: { createdAt: { gte: soixante_jours, lt: trente_jours } } }),
  ])

  // Graphique 7 derniers jours (candidatures + demandes + messages)
  const days7: { date: string; candidatures: number; demandes: number; messages: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(now.getDate() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    const [c, dm, msg] = await Promise.all([
      prisma.candidature.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.demande.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.message.count({ where: { createdAt: { gte: start, lt: end } } }),
    ])
    days7.push({ date: start.toISOString().slice(0, 10), candidatures: c, demandes: dm, messages: msg })
  }

  const par_poste: Record<string, number> = {}
  candidaturesParPoste.forEach(g => { par_poste[g.posteSouhaite] = (g._count as { _all: number })._all })

  const par_statut: Record<string, number> = {}
  candidaturesParStatut.forEach(g => { par_statut[g.statut] = (g._count as { _all: number })._all })

  const par_service: Record<string, number> = {}
  demandesParService.forEach(g => { par_service[g.serviceSouhaite] = (g._count as { _all: number })._all })

  const tendance = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0
    return Math.round(((current - prev) / prev) * 100)
  }

  res.json({
    candidatures: {
      total: totalCandidatures,
      nouveaux_7j: nouvellesCandidatures7j,
      a_traiter: candidaturesATraiter,
      par_poste, par_statut,
      tendance_30j: tendance(candidatures30j, candidaturesPrev30j),
    },
    demandes: {
      total: totalDemandes,
      nouveaux_7j: nouvellesDemandes7j,
      nouvelles: demandesNouvelles,
      par_service,
      tendance_30j: tendance(demandes30j, demandesPrev30j),
    },
    messages: {
      total: totalMessages,
      non_lus: messagesNonLus,
      nouveaux_7j: nouveauxMessages7j,
      tendance_30j: tendance(messages30j, messagesPrev30j),
    },
    graph_7j: days7,
    dernieres_candidatures: dernieresCandidatures,
    dernieres_demandes: dernieresDemandes,
    derniers_messages: derniersMessages,
  })
}
