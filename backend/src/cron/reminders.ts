import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
})

const FROM = process.env.MAIL_FROM || 'Global Clean Tech <contact@globalcleantechsn.com>'
const ADMIN = process.env.MAIL_ADMIN || 'contact@globalcleantechsn.com'
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173'
// Toujours l'URL publique de prod (indépendante de FRONTEND_URL, localhost en dev)
const LOGO_URL = process.env.MAIL_LOGO_URL || 'https://globalcleantechsn.com/logo.png'
const LOGO_HEADER = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
    <tr>
      <td style="padding-right:10px;vertical-align:middle">
        <img src="${LOGO_URL}" alt="Global Clean Tech" width="40" height="40" style="display:block;border-radius:8px" />
      </td>
      <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:16px;color:#1A7F4B">
        Global Clean Tech
      </td>
    </tr>
  </table>
`

const POSTE_LABELS: Record<string, string> = {
  femme_menage: 'Femme de ménage', nounou: 'Nounou', cuisinier: 'Cuisinier(ère)',
  chauffeur: 'Chauffeur', gardien: 'Gardien', majordome: 'Majordome', autre: 'Autre',
}

export function startCronJobs() {
  // Tous les jours à 8h00 — rappel candidatures en attente depuis +3 jours
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Vérification rappels candidatures...')
    try {
      const seuil = new Date()
      seuil.setDate(seuil.getDate() - 3)

      const enAttente = await prisma.candidature.findMany({
        where: { statut: 'a_traiter', createdAt: { lte: seuil } },
        select: { id: true, nomComplet: true, posteSouhaite: true, telephone: true, createdAt: true },
      })

      if (enAttente.length === 0) return

      const lignes = enAttente.map(c => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #eee">#${c.id}</td>
          <td style="padding:6px;border-bottom:1px solid #eee">${c.nomComplet}</td>
          <td style="padding:6px;border-bottom:1px solid #eee">${POSTE_LABELS[c.posteSouhaite] ?? c.posteSouhaite}</td>
          <td style="padding:6px;border-bottom:1px solid #eee">${c.telephone}</td>
          <td style="padding:6px;border-bottom:1px solid #eee">${new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
          <td style="padding:6px;border-bottom:1px solid #eee">
            <a href="${FRONTEND}/admin/candidatures/${c.id}" style="color:#1A7F4B">Voir</a>
          </td>
        </tr>`).join('')

      await transporter.sendMail({
        from: FROM,
        to: ADMIN,
        subject: `[GCT] ⏰ Rappel — ${enAttente.length} candidature(s) en attente depuis +3 jours`,
        html: `
          <div style="font-family:sans-serif;max-width:700px">
            ${LOGO_HEADER}
            <h2 style="color:#C8860A">⏰ Rappel — Candidatures en attente</h2>
            <p>${enAttente.length} candidature(s) sont en statut <strong>À traiter</strong> depuis plus de 3 jours.</p>
            <table style="border-collapse:collapse;width:100%">
              <thead>
                <tr style="background:#f2f4f3">
                  <th style="padding:8px;text-align:left">#</th>
                  <th style="padding:8px;text-align:left">Nom</th>
                  <th style="padding:8px;text-align:left">Poste</th>
                  <th style="padding:8px;text-align:left">Téléphone</th>
                  <th style="padding:8px;text-align:left">Reçu le</th>
                  <th style="padding:8px;text-align:left">Action</th>
                </tr>
              </thead>
              <tbody>${lignes}</tbody>
            </table>
            <p style="margin-top:20px">
              <a href="${FRONTEND}/admin/candidatures?statut=a_traiter"
                 style="background:#1A7F4B;color:white;padding:10px 20px;text-decoration:none;border-radius:6px">
                Voir toutes les candidatures à traiter
              </a>
            </p>
            <p style="color:#aaa;font-size:12px;margin-top:24px">
              Email automatique envoyé par Global Clean Tech Dashboard · ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        `,
      })
      console.log(`[CRON] Rappel envoyé pour ${enAttente.length} candidature(s)`)
    } catch (e) {
      console.error('[CRON] Erreur rappels:', e)
    }
  }, { timezone: 'Africa/Dakar' })

  // Tous les 1er du mois à 9h00 — rapport mensuel automatique
  cron.schedule('0 9 1 * *', async () => {
    console.log('[CRON] Génération rapport mensuel...')
    try {
      const now = new Date()
      const debut = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const fin = new Date(now.getFullYear(), now.getMonth(), 1)
      const moisLabel = debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

      const [candidatures, demandes, messages, placements] = await Promise.all([
        prisma.candidature.count({ where: { createdAt: { gte: debut, lt: fin } } }),
        prisma.demande.count({ where: { createdAt: { gte: debut, lt: fin } } }),
        prisma.message.count({ where: { createdAt: { gte: debut, lt: fin } } }),
        prisma.placement.count({ where: { createdAt: { gte: debut, lt: fin } } }),
      ])

      await transporter.sendMail({
        from: FROM,
        to: ADMIN,
        subject: `[GCT] 📊 Rapport mensuel — ${moisLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px">
            ${LOGO_HEADER}
            <h2 style="color:#1A7F4B">📊 Rapport mensuel — ${moisLabel}</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr style="background:#f2f4f3"><td style="padding:12px;font-weight:bold">Nouvelles candidatures</td><td style="padding:12px;font-size:24px;font-weight:bold;color:#1A7F4B">${candidatures}</td></tr>
              <tr><td style="padding:12px;font-weight:bold">Nouvelles demandes</td><td style="padding:12px;font-size:24px;font-weight:bold;color:#C8860A">${demandes}</td></tr>
              <tr style="background:#f2f4f3"><td style="padding:12px;font-weight:bold">Messages reçus</td><td style="padding:12px;font-size:24px;font-weight:bold;color:#3B82F6">${messages}</td></tr>
              <tr><td style="padding:12px;font-weight:bold">Placements réalisés</td><td style="padding:12px;font-size:24px;font-weight:bold;color:#10B981">${placements}</td></tr>
            </table>
            <p style="margin-top:20px">
              <a href="${FRONTEND}/admin/dashboard"
                 style="background:#1A7F4B;color:white;padding:10px 20px;text-decoration:none;border-radius:6px">
                Voir le dashboard complet
              </a>
            </p>
          </div>
        `,
      })
      console.log('[CRON] Rapport mensuel envoyé.')
    } catch (e) {
      console.error('[CRON] Erreur rapport mensuel:', e)
    }
  }, { timezone: 'Africa/Dakar' })

  console.log('⏰ Cron jobs démarrés (rappels 8h, rapport 1er du mois 9h)')
}
