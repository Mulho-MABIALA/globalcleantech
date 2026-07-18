import nodemailer from 'nodemailer'
import crypto from 'crypto'

const PORT = Number(process.env.MAIL_PORT) || 2525

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: PORT,
  secure: PORT === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const FROM = process.env.MAIL_FROM || 'Global Clean Tech <contact@globalcleantechsn.com>'
const ADMIN = process.env.MAIL_ADMIN || 'contact@globalcleantechsn.com'

// Logo utilisé dans les emails : toujours l'URL publique de prod par défaut
// (indépendante de FRONTEND_URL, qui vaut http://localhost:... en dev et ne
// serait donc pas accessible par les clients mail). Surchargeable via .env.
const LOGO_URL = process.env.MAIL_LOGO_URL || 'https://globalcleantechsn.com/logo.png'

/** En-tête logo + nom, à insérer en haut des emails sur fond blanc. */
function logoHeader(): string {
  return `
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
}

/** SMTP est-il configuré ? (MAIL_HOST + MAIL_USER + MAIL_PASS présents) */
export function mailConfigured(): boolean {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS)
}

/** Envoi tolérant : si SMTP absent, log un avertissement au lieu de planter. */
async function deliver(opts: { to: string; subject: string; html: string }) {
  if (!mailConfigured()) {
    console.warn(`[mail] SMTP non configuré (MAIL_HOST/MAIL_USER/MAIL_PASS dans .env) — email non envoyé : "${opts.subject}"`)
    return
  }
  await transporter.sendMail({ from: FROM, ...opts })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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

  await deliver({
    to: ADMIN,
    subject: `[GCT] Nouvelle candidature #${data.id} — ${postes[data.posteSouhaite] || data.posteSouhaite}`,
    html: `
      ${logoHeader()}
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

  await deliver({
    to: ADMIN,
    subject: `[GCT] Nouvelle demande #${data.id} — ${services[data.serviceSouhaite] || data.serviceSouhaite}`,
    html: `
      ${logoHeader()}
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
  await deliver({
    to: ADMIN,
    subject: `[GCT] Nouveau message #${data.id} — ${data.sujet}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        ${logoHeader()}
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
  await deliver({
    to: data.email,
    subject: `Votre candidature GCT — ${label}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        ${logoHeader()}
        <h2 style="color:#1A7F4B">Mise à jour de votre dossier</h2>
        <p>Bonjour <strong>${data.nom}</strong>,</p>
        <p>Votre candidature pour le poste de <strong>${data.poste}</strong> vient d'être mise à jour :</p>
        <div style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;margin:20px 0;border-left:4px solid #1A7F4B">
          <span style="font-size:20px;font-weight:700;color:#1A7F4B">${label}</span>
        </div>
        <p style="color:#666;font-size:14px">Pour toute question, contactez-nous par WhatsApp ou email à contact@globalcleantechsn.com.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Global Clean Tech · Thiès, Sénégal</p>
      </div>
    `,
  })
}

export async function sendDemandeConfirmationMail(to: string, nom: string, service: string) {
  await deliver({
    to,
    subject: 'Votre demande a bien été reçue — Global Clean Tech',
    html: `
      ${logoHeader()}
      <h2>Bonjour ${nom},</h2>
      <p>Nous avons bien reçu votre demande concernant : <strong>${service}</strong>.</p>
      <p>Notre équipe vous contactera dans les plus brefs délais.</p>
      <br/>
      <p>Cordialement,<br/><strong>L'équipe Global Clean Tech</strong></p>
      <p style="color:#888;font-size:12px">Thiès, Sénégal — contact@globalcleantechsn.com</p>
    `,
  })
}

/**
 * Envoie l'affiche visuelle d'un candidat (générée côté frontend, signée par
 * l'administrateur) par email — au candidat lui-même ou à un client. Lève une
 * erreur si le SMTP n'est pas configuré, pour que l'appelant puisse répondre
 * explicitement à l'admin (pas d'échec silencieux ici, contrairement à `deliver`).
 */
export async function sendCandidatureAfficheMail(data: {
  to: string
  nomComplet: string
  poste: string
  imageBuffer: Buffer
}) {
  if (!mailConfigured()) {
    throw new Error('SMTP non configuré (MAIL_HOST/MAIL_USER/MAIL_PASS).')
  }

  const filename = `profil-${data.nomComplet.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.png`

  await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `Profil — ${data.nomComplet} (${data.poste}) — Global Clean Tech`,
    html: `
      ${logoHeader()}
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-dessous le profil de <strong>${data.nomComplet}</strong> (${data.poste}), transmis par Global Clean Tech.</p>
      <img src="cid:gct-affiche" alt="Profil ${escapeHtml(data.nomComplet)}" style="max-width:100%;border-radius:8px;margin-top:12px;display:block" />
      <p style="color:#888;font-size:12px;margin-top:20px">Global Clean Tech · Thiès, Sénégal · contact@globalcleantechsn.com</p>
    `,
    attachments: [
      { filename, content: data.imageBuffer, cid: 'gct-affiche', contentType: 'image/png' },
    ],
  })
}

// ── Newsletter ────────────────────────────────────────────────────────────────

/** Jeton de désinscription : HMAC de l'email, vérifiable sans stockage en base. */
export function newsletterToken(email: string): string {
  const secret = process.env.JWT_SECRET || 'gct-newsletter-secret'
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32)
}

/**
 * Envoie la newsletter à un abonné. Lève une erreur en cas d'échec SMTP
 * (l'appelant compte les envois réussis/échoués).
 */
export async function sendNewsletterMail(to: string, sujet: string, contenu: string) {
  const site = process.env.FRONTEND_URL || 'https://globalcleantechsn.com'
  const unsubscribeUrl = `${site.replace(/\/+$/, '')}/api/public/newsletter/unsubscribe?email=${encodeURIComponent(to)}&token=${newsletterToken(to)}`
  const corps = escapeHtml(contenu).replace(/\r?\n/g, '<br/>')

  await transporter.sendMail({
    from: FROM,
    to,
    subject: sujet,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto">
        <div style="background:#1A7F4B;padding:20px 24px;border-radius:10px 10px 0 0">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:10px;vertical-align:middle">
                <img src="${LOGO_URL}" alt="Global Clean Tech" width="36" height="36" style="display:block;border-radius:8px;background:#ffffff;padding:2px" />
              </td>
              <td style="vertical-align:middle">
                <span style="color:#ffffff;font-size:20px;font-weight:bold">Global Clean Tech</span>
                <span style="color:#c8e6d4;font-size:13px;display:block;margin-top:2px">Propreté · Qualité · Durabilité</span>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;background:#ffffff">
          <h2 style="color:#1A7F4B;margin:0 0 16px">${escapeHtml(sujet)}</h2>
          <div style="color:#333333;font-size:15px;line-height:1.7">${corps}</div>
          <p style="margin-top:28px;color:#666666;font-size:14px;line-height:1.6">
            Cordialement,<br/><strong>L'équipe Global Clean Tech</strong><br/>
            Quartier Médina Fall, Thiès, Sénégal<br/>
            +221 75 642 26 00 · +221 77 350 18 25 · contact@globalcleantechsn.com
          </p>
        </div>
        <p style="text-align:center;color:#999999;font-size:12px;margin-top:16px;line-height:1.6">
          Vous recevez cet email car vous êtes inscrit(e) à la newsletter de Global Clean Tech.<br/>
          <a href="${unsubscribeUrl}" style="color:#999999">Se désinscrire</a>
        </p>
      </div>
    `,
  })
}
