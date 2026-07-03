import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const FROM = process.env.MAIL_FROM || 'Global Clean Tech <contact@globalcleantech.sn>'
const ADMIN = process.env.MAIL_ADMIN || 'contact@globalcleantech.sn'

export async function sendCandidatureAdminMail(data: {
  id: number
  nomComplet: string
  telephone: string
  email?: string | null
  ville: string
  posteSouhaite: string
  experience: string
}) {
  const postes: Record<string, string> = {
    femme_menage: 'Femme de ménage',
    nounou: 'Nounou',
    cuisinier: 'Cuisinier(ère)',
    chauffeur: 'Chauffeur',
    gardien: 'Gardien',
    majordome: 'Majordome',
    autre: 'Autre',
  }

  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `[GCT] Nouvelle candidature #${data.id} — ${postes[data.posteSouhaite] || data.posteSouhaite}`,
    html: `
      <h2>Nouvelle candidature reçue</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px;font-weight:bold">N°</td><td style="padding:6px">#${data.id}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Nom complet</td><td style="padding:6px">${data.nomComplet}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Poste souhaité</td><td style="padding:6px">${postes[data.posteSouhaite] || data.posteSouhaite}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Ville</td><td style="padding:6px">${data.ville}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Téléphone</td><td style="padding:6px">${data.telephone}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px">${data.email || '—'}</td></tr>
      </table>
      <p style="margin-top:16px">
        <a href="${process.env.FRONTEND_URL}/admin/candidatures/${data.id}"
           style="background:#1A7F4B;color:white;padding:8px 16px;text-decoration:none;border-radius:4px">
          Voir dans le dashboard
        </a>
      </p>
    `,
  })
}

export async function sendDemandeAdminMail(data: {
  id: number
  nomRaisonSociale: string
  telephone: string
  email: string
  serviceSouhaite: string
  description: string
}) {
  const services: Record<string, string> = {
    placement: 'Placement de personnel',
    impression: 'Impression / Photocopie',
    redaction: 'Rédaction / Communication',
    transfert: 'Transfert d\'argent',
    communication: 'Communication / Journalisme',
    autre: 'Autre',
  }

  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `[GCT] Nouvelle demande #${data.id} — ${services[data.serviceSouhaite] || data.serviceSouhaite}`,
    html: `
      <h2>Nouvelle demande client reçue</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px;font-weight:bold">N°</td><td style="padding:6px">#${data.id}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Nom / Raison sociale</td><td style="padding:6px">${data.nomRaisonSociale}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Service souhaité</td><td style="padding:6px">${services[data.serviceSouhaite] || data.serviceSouhaite}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Téléphone</td><td style="padding:6px">${data.telephone}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px">${data.email}</td></tr>
      </table>
      <p><strong>Description :</strong></p>
      <p style="background:#f2f4f3;padding:12px;border-radius:4px">${data.description}</p>
      <p>
        <a href="${process.env.FRONTEND_URL}/admin/demandes/${data.id}"
           style="background:#1A7F4B;color:white;padding:8px 16px;text-decoration:none;border-radius:4px">
          Voir dans le dashboard
        </a>
      </p>
    `,
  })
}

export async function sendMessageAdminMail(data: {
  id: number
  nom: string
  email: string
  telephone?: string | null
  sujet: string
  corps: string
}) {
  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `[GCT] Nouveau message #${data.id} — ${data.sujet}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#1A7F4B">Nouveau message reçu</h2>
        <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
          <tr><td style="padding:6px;font-weight:bold;color:#555">De</td><td style="padding:6px">${data.nom}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;color:#555">Email</td><td style="padding:6px"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          ${data.telephone ? `<tr><td style="padding:6px;font-weight:bold;color:#555">Téléphone</td><td style="padding:6px">${data.telephone}</td></tr>` : ''}
          <tr><td style="padding:6px;font-weight:bold;color:#555">Sujet</td><td style="padding:6px">${data.sujet}</td></tr>
        </table>
        <p style="font-weight:bold;color:#555">Message :</p>
        <div style="background:#f2f4f3;padding:16px;border-radius:8px;border-left:4px solid #1A7F4B;white-space:pre-wrap">${data.corps}</div>
        <p style="margin-top:20px">
          <a href="${process.env.FRONTEND_URL}/admin/messages/${data.id}"
             style="background:#1A7F4B;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold">
            Voir dans le dashboard
          </a>
          &nbsp;&nbsp;
          <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.sujet)}"
             style="background:#f2f4f3;color:#333;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;border:1px solid #ddd">
            Répondre par email
          </a>
        </p>
      </div>
    `,
  })
}

export async function sendStatutUpdateMail(data: {
  email: string
  nom: string
  statut: string
  poste: string
  id: number
}) {
  const labels: Record<string, string> = {
    recu: '📥 Reçu', en_cours: '🔍 En cours d\'examen', entretien: '📅 Entretien prévu',
    accepte: '✅ Accepté', refuse: '❌ Non retenu', place: '🎉 Placé avec succès',
  }
  const label = labels[data.statut] ?? data.statut
  await transporter.sendMail({
    from: FROM, to: data.email,
    subject: `Votre candidature GCT — ${label}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1A7F4B">Mise à jour de votre dossier</h2>
        <p>Bonjour <strong>${data.nom}</strong>,</p>
        <p>Votre candidature pour le poste de <strong>${data.poste}</strong> vient d'être mise à jour :</p>
        <div style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;margin:20px 0;border-left:4px solid #1A7F4B">
          <span style="font-size:20px;font-weight:700;color:#1A7F4B">${label}</span>
        </div>
        <p style="color:#666;font-size:14px">Pour toute question, contactez-nous par WhatsApp ou email à contact@globalcleantech.sn.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Global Clean Tech · Thiès, Sénégal</p>
      </div>
    `,
  })
}

export async function sendDemandeConfirmationMail(to: string, nom: string, service: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Votre demande a bien été reçue — Global Clean Tech',
    html: `
      <h2>Bonjour ${nom},</h2>
      <p>Nous avons bien reçu votre demande concernant : <strong>${service}</strong>.</p>
      <p>Notre équipe vous contactera dans les plus brefs délais.</p>
      <br/>
      <p>Cordialement,<br/><strong>L'équipe Global Clean Tech</strong></p>
      <p style="color:#888;font-size:12px">Thiès, Sénégal — contact@globalcleantech.sn</p>
    `,
  })
}
