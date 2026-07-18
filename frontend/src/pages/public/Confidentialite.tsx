import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black font-display text-sm shrink-0">
          {num}
        </span>
        <h2 className="text-lg font-bold font-display text-dark">{title}</h2>
      </div>
      <div className="text-sm text-muted leading-relaxed space-y-3 [&_strong]:text-dark">
        {children}
      </div>
    </section>
  )
}

const DATA_COLLECTED = [
  {
    title: 'Formulaire de candidature',
    items: 'Nom complet, date de naissance, téléphone, email (optionnel), ville, poste souhaité, expérience, disponibilité, CV, photo, pièce d\'identité (recto/verso)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
  {
    title: 'Formulaire de demande client',
    items: 'Nom ou raison sociale, type de demandeur, téléphone, email, service souhaité, description du besoin, budget estimé',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
  {
    title: 'Formulaire de contact',
    items: 'Nom, email, téléphone (optionnel), sujet et contenu du message',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    title: 'Newsletter',
    items: 'Adresse email uniquement',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />,
  },
]

const RIGHTS = [
  { title: 'Droit d\'accès', desc: 'Obtenir une copie des données que nous détenons sur vous.' },
  { title: 'Droit de rectification', desc: 'Faire corriger des données inexactes ou incomplètes.' },
  { title: 'Droit de suppression', desc: 'Demander l\'effacement de vos données et documents.' },
  { title: 'Droit d\'opposition', desc: 'Vous opposer à un traitement ou retirer votre consentement à tout moment.' },
]

export default function Confidentialite() {
  useEffect(() => {
    document.title = 'Politique de confidentialité — Global Clean Tech'
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="bg-surface min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0D3D27] via-primary to-[#2AAD6A] py-16 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 mb-5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Vos données protégées
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">Politique de confidentialité</h1>
          <p className="text-white/65">Dernière mise à jour : juillet 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 space-y-5">
        {/* Engagement */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-sm text-muted leading-relaxed">
            Chez <strong className="text-dark">Global Clean Tech</strong>, la confiance est au cœur de notre métier.
            Cette politique explique quelles données personnelles nous collectons via ce site, pourquoi nous
            les collectons, combien de temps nous les conservons et quels sont vos droits, conformément à la{' '}
            <strong className="text-dark">loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> portant sur la
            protection des données à caractère personnel.
          </p>
        </div>

        <Section num="1" title="Responsable du traitement">
          <p>
            Le responsable du traitement des données est <strong>Global Clean Tech</strong>,
            Quartier Médina Fall, Thiès, Sénégal —{' '}
            <a href="mailto:contact@globalcleantechsn.com" className="text-primary hover:underline">contact@globalcleantechsn.com</a> —{' '}
            <a href="tel:+221756422600" className="text-primary hover:underline">+221 75 642 26 00</a>.
          </p>
        </Section>

        <Section num="2" title="Données collectées">
          <p>Nous collectons uniquement les données que vous nous transmettez volontairement via nos formulaires :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {DATA_COLLECTED.map(d => (
              <div key={d.title} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{d.icon}</svg>
                  </span>
                  <p className="font-semibold text-dark text-sm">{d.title}</p>
                </div>
                <p className="text-xs text-muted leading-relaxed">{d.items}</p>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Le site n'utilise <strong>aucun cookie publicitaire ni outil de suivi</strong>. Seul un jeton de
            session est stocké dans le navigateur des administrateurs pour accéder à l'espace de gestion.
          </p>
        </Section>

        <Section num="3" title="Finalités du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Étudier votre candidature et vous proposer des opportunités de placement adaptées ;</li>
            <li>Traiter les demandes de service des clients (placement, impression, communication, transfert) ;</li>
            <li>Répondre à vos messages envoyés via le formulaire de contact ;</li>
            <li>Vous envoyer notre newsletter mensuelle si vous y êtes inscrit(e) ;</li>
            <li>Assurer le suivi administratif des placements réalisés.</li>
          </ul>
          <p>Elles ne sont <strong>jamais vendues</strong> ni utilisées à des fins publicitaires.</p>
        </Section>

        <Section num="4" title="Partage des données">
          <p>
            Vos données de candidature (profil, expérience) ne sont présentées à un employeur potentiel
            qu'avec <strong>votre accord préalable</strong>, dans le cadre d'une mise en relation.
            Vos pièces d'identité ne servent qu'à la vérification interne de votre dossier.
          </p>
          <p>
            Aucune donnée n'est transmise à des tiers en dehors de ce cadre, sauf obligation légale
            (réquisition judiciaire ou administrative).
          </p>
        </Section>

        <Section num="5" title="Durée de conservation">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Candidatures :</strong> pendant la durée de votre recherche d'emploi, puis archivées ; supprimées sur simple demande.</li>
            <li><strong>Demandes clients et messages :</strong> le temps du traitement, puis archivés à des fins de suivi.</li>
            <li><strong>Newsletter :</strong> jusqu'à votre désinscription.</li>
          </ul>
        </Section>

        <Section num="6" title="Sécurité">
          <p>
            Les données sont stockées sur des systèmes sécurisés dont l'accès est restreint à
            l'équipe de Global Clean Tech, protégé par authentification individuelle. Les documents
            transmis (CV, pièces d'identité, photos) ne sont accessibles qu'aux personnes habilitées
            au traitement de votre dossier.
          </p>
        </Section>

        <Section num="7" title="Vos droits">
          <p>Conformément à la loi n° 2008-12, vous disposez des droits suivants :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {RIGHTS.map(r => (
              <div key={r.title} className="flex items-start gap-3 border border-gray-100 rounded-xl p-4">
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-dark text-sm">{r.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Pour exercer ces droits, écrivez-nous à{' '}
            <a href="mailto:contact@globalcleantechsn.com" className="text-primary hover:underline">contact@globalcleantechsn.com</a>{' '}
            ou contactez-nous par WhatsApp. Nous répondons sous <strong>72 heures ouvrables</strong>.
            Vous pouvez également saisir la <strong>Commission de protection des Données Personnelles (CDP)</strong> du Sénégal.
          </p>
        </Section>

        {/* Contact CTA */}
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="font-semibold text-dark text-sm">Une question sur vos données ?</p>
            <p className="text-sm text-muted mt-0.5">Notre équipe vous répond rapidement, en toute transparence.</p>
          </div>
          <Link to="/contact" className="btn-primary text-sm shrink-0">
            Nous contacter
          </Link>
        </div>
      </div>
    </main>
  )
}
