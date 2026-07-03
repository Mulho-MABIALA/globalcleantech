"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.notifyCandidature = notifyCandidature;
exports.notifyDemande = notifyDemande;
exports.notifyContact = notifyContact;
exports.notifyStatutCandidature = notifyStatutCandidature;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.MAIL_PORT) || 2525,
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
    },
});
const FROM = process.env.MAIL_FROM || 'Global Clean Tech <contact@globalcleantech.sn>';
const ADMIN = process.env.MAIL_ADMIN || 'contact@globalcleantech.sn';
async function sendMail(opts) {
    if (!process.env.MAIL_USER)
        return; // Skip if not configured
    await transporter.sendMail({ from: FROM, ...opts });
}
async function notifyCandidature(data) {
    const subject = `🆕 Nouvelle candidature — ${data.nomComplet}`;
    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#1A7F4B">Nouvelle candidature reçue</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;color:#666">Nom</td><td style="padding:8px;font-weight:600">${data.nomComplet}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Poste souhaité</td><td style="padding:8px">${data.posteSouhaite}</td></tr>
        <tr><td style="padding:8px;color:#666">Téléphone</td><td style="padding:8px">${data.telephone}</td></tr>
        ${data.email ? `<tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${data.email}</td></tr>` : ''}
      </table>
      <a href="${process.env.FRONTEND_URL}/admin/candidatures" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1A7F4B;color:white;border-radius:8px;text-decoration:none;font-weight:600">
        Voir dans le dashboard →
      </a>
    </div>
  `;
    await sendMail({ to: ADMIN, subject, html });
}
async function notifyDemande(data) {
    const subject = `🆕 Nouvelle demande client — ${data.nomRaisonSociale}`;
    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#1A7F4B">Nouvelle demande client reçue</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;color:#666">Client</td><td style="padding:8px;font-weight:600">${data.nomRaisonSociale}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Service souhaité</td><td style="padding:8px">${data.serviceSouhaite}</td></tr>
        <tr><td style="padding:8px;color:#666">Téléphone</td><td style="padding:8px">${data.telephone}</td></tr>
        ${data.email ? `<tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${data.email}</td></tr>` : ''}
      </table>
      <a href="${process.env.FRONTEND_URL}/admin/demandes" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1A7F4B;color:white;border-radius:8px;text-decoration:none;font-weight:600">
        Voir dans le dashboard →
      </a>
    </div>
  `;
    await sendMail({ to: ADMIN, subject, html });
}
async function notifyContact(data) {
    const subject = `📩 Message de contact — ${data.nom}`;
    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#1A7F4B">Nouveau message de contact</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;color:#666">Nom</td><td style="padding:8px;font-weight:600">${data.nom}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${data.email}</td></tr>
        <tr><td style="padding:8px;color:#666">Sujet</td><td style="padding:8px">${data.sujet}</td></tr>
      </table>
      <div style="margin-top:12px;padding:12px;background:#f0fdf4;border-left:3px solid #1A7F4B;border-radius:4px">
        <p style="margin:0;color:#333">${data.message.replace(/\n/g, '<br/>')}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/admin/messages" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1A7F4B;color:white;border-radius:8px;text-decoration:none;font-weight:600">
        Voir dans le dashboard →
      </a>
    </div>
  `;
    await sendMail({ to: ADMIN, subject, html });
}
async function notifyStatutCandidature(data) {
    const LABELS = {
        recu: 'Reçu', en_cours: 'En cours d\'examen', entretien: 'Entretien prévu',
        accepte: 'Accepté ✅', refuse: 'Non retenu', place: 'Placé 🎉',
    };
    const label = LABELS[data.statut] ?? data.statut;
    const subject = `📋 Votre dossier Global Clean Tech — ${label}`;
    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#1A7F4B">Mise à jour de votre candidature</h2>
      <p>Bonjour <strong>${data.nom}</strong>,</p>
      <p>Votre dossier pour le poste de <strong>${data.poste}</strong> a été mis à jour :</p>
      <div style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;margin:16px 0">
        <span style="font-size:18px;font-weight:700;color:#1A7F4B">${label}</span>
      </div>
      <p style="color:#666;font-size:14px">Pour toute question, contactez-nous par WhatsApp ou email.</p>
    </div>
  `;
    await sendMail({ to: data.email, subject, html });
}
//# sourceMappingURL=mailer.js.map