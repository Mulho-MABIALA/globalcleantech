import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { sendMessageAdminMail, newsletterToken } from '../services/mail.service'

const router = Router()
const prisma = new PrismaClient()

// GET /api/public/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [placements, clients, totalCandidats] = await Promise.all([
      prisma.candidature.count({ where: { statut: 'place' } }),
      prisma.demande.count({ where: { statut: 'cloturee' } }),
      prisma.candidature.count(),
    ])
    res.json({
      placements: placements || 500,
      clients: clients || 150,
      candidats: totalCandidats,
      services: 6,
      annees: new Date().getFullYear() - 2019,
    })
  } catch {
    res.json({ placements: 500, clients: 150, candidats: 0, services: 6, annees: 5 })
  }
})

// POST /api/public/newsletter — inscription publique
router.post('/newsletter', async (req: Request, res: Response) => {
  const { email, nom } = req.body as { email?: string; nom?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Adresse email invalide.' })
    return
  }
  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (!existing.actif) {
        await prisma.newsletterSubscriber.update({ where: { email }, data: { actif: true, nom: nom || existing.nom } })
        res.status(200).json({ message: 'Inscription réactivée.' })
        return
      }
      res.status(200).json({ message: 'Déjà inscrit.' })
      return
    }
    await prisma.newsletterSubscriber.create({ data: { email, nom: nom || null } })
    res.status(201).json({ message: 'Inscription confirmée.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

// GET /api/public/newsletter/unsubscribe?email=...&token=... — désinscription en un clic
router.get('/newsletter/unsubscribe', async (req: Request, res: Response) => {
  const { email, token } = req.query as { email?: string; token?: string }
  const page = (titre: string, texte: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre} — Global Clean Tech</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f2f4f3;margin:0;padding:60px 20px;text-align:center">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:40px 28px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
    <h2 style="color:#1A7F4B;margin-top:0">${titre}</h2>
    <p style="color:#444;line-height:1.6">${texte}</p>
  </div>
</body></html>`

  if (!email || !token || token !== newsletterToken(email)) {
    res.status(400).send(page('Lien invalide', 'Ce lien de désinscription est invalide ou expiré.'))
    return
  }
  try {
    await prisma.newsletterSubscriber.updateMany({ where: { email }, data: { actif: false } })
    const safeEmail = email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    res.send(page('Désinscription confirmée', `L'adresse <strong>${safeEmail}</strong> ne recevra plus la newsletter de Global Clean Tech.`))
  } catch {
    res.status(500).send(page('Erreur', 'Une erreur est survenue. Réessayez plus tard.'))
  }
})

// GET /api/public/content/:cle — contenu de page public
router.get('/content/:cle', async (req: Request, res: Response) => {
  const { cle } = req.params
  try {
    const content = await prisma.siteContent.findUnique({ where: { cle } })
    res.json({ cle, valeur: content?.valeur ?? null })
  } catch {
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

// GET /api/public/content — tous les contenus (pour la page À propos)
router.get('/content', async (_req: Request, res: Response) => {
  try {
    const contents = await prisma.siteContent.findMany()
    const map: Record<string, string> = {}
    contents.forEach(c => { map[c.cle] = c.valeur })
    res.json(map)
  } catch {
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

// GET /api/public/services — liste des services actifs
router.get('/services', async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' },
    })
    res.json(services)
  } catch {
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

// GET /api/public/candidature/statut?telephone=XXX
router.get('/candidature/statut', async (req: Request, res: Response) => {
  const { telephone } = req.query as { telephone?: string }
  if (!telephone || telephone.length < 8) {
    res.status(400).json({ message: 'Numéro de téléphone requis.' }); return
  }
  const candidature = await prisma.candidature.findFirst({
    where: { telephone: { contains: telephone.replace(/\s/g, '') } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nomComplet: true, posteSouhaite: true, statut: true, createdAt: true },
  })
  if (!candidature) { res.status(404).json({ message: 'Aucune candidature trouvée.' }); return }
  res.json(candidature)
})

// POST /api/public/contact — formulaire de contact
router.post('/contact', async (req: Request, res: Response) => {
  const { nom, email, telephone, sujet, corps } = req.body as {
    nom?: string; email?: string; telephone?: string; sujet?: string; corps?: string
  }
  if (!nom || !email || !sujet || !corps) {
    res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' }); return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Email invalide.' }); return
  }
  try {
    const message = await prisma.message.create({
      data: { nom, email, telephone: telephone || null, sujet, corps },
    })
    sendMessageAdminMail({ id: message.id, nom, email, telephone, sujet, corps }).catch(() => {})
    res.status(201).json({ message: 'Message envoyé avec succès.' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

// GET /api/public/actualites
router.get('/actualites', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.actualite.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' },
    })
    res.json(items)
  } catch {
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

export default router
