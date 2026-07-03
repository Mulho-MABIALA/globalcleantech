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

export default function MentionsLegales() {
  useEffect(() => {
    document.title = 'Mentions légales — Global Clean Tech'
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            Informations légales
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">Mentions légales</h1>
          <p className="text-white/65">Dernière mise à jour : juillet 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 space-y-5">
        <Section num="1" title="Éditeur du site">
          <p>
            Le présent site est édité par <strong>Global Clean Tech</strong>, agence de placement de personnel
            et de services, dont le siège est situé au Quartier Médina Fall, Thiès, Sénégal.
          </p>
          <ul className="space-y-1.5">
            <li><strong>Dénomination :</strong> Global Clean Tech</li>
            <li><strong>Adresse :</strong> Quartier Médina Fall, Thiès, Sénégal</li>
            <li><strong>Téléphone :</strong> <a href="tel:+221756422600" className="text-primary hover:underline">+221 75 642 26 00</a> · <a href="tel:+221773501825" className="text-primary hover:underline">+221 77 350 18 25</a></li>
            <li><strong>Email :</strong> <a href="mailto:contact@globalcleantech.sn" className="text-primary hover:underline">contact@globalcleantech.sn</a></li>
          </ul>
        </Section>

        <Section num="2" title="Directeur de la publication">
          <p>
            Le directeur de la publication est le représentant légal de Global Clean Tech,
            joignable via les coordonnées indiquées ci-dessus.
          </p>
        </Section>

        <Section num="3" title="Hébergement">
          <p>
            Le site et ses données sont hébergés sur des serveurs sécurisés. Pour toute question
            relative à l'hébergement, contactez-nous à l'adresse{' '}
            <a href="mailto:contact@globalcleantech.sn" className="text-primary hover:underline">contact@globalcleantech.sn</a>.
          </p>
        </Section>

        <Section num="4" title="Propriété intellectuelle">
          <p>
            L'ensemble des éléments composant ce site (textes, images, logo, charte graphique,
            structure, code) est la propriété exclusive de Global Clean Tech, sauf mention contraire.
          </p>
          <p>
            Toute reproduction, représentation, modification ou diffusion, totale ou partielle,
            de ces éléments sans autorisation écrite préalable est interdite et constitue une
            contrefaçon susceptible d'engager la responsabilité de son auteur.
          </p>
        </Section>

        <Section num="5" title="Responsabilité">
          <p>
            Global Clean Tech s'efforce d'assurer l'exactitude et la mise à jour des informations
            diffusées sur ce site. Elle ne saurait toutefois être tenue responsable des erreurs,
            omissions ou d'une indisponibilité temporaire du service.
          </p>
          <p>
            Les informations fournies le sont à titre indicatif et ne dispensent pas d'une analyse
            personnalisée de chaque situation. L'utilisation des informations se fait sous la
            responsabilité exclusive de l'utilisateur.
          </p>
        </Section>

        <Section num="6" title="Liens externes">
          <p>
            Ce site peut contenir des liens vers des sites tiers (réseaux sociaux, site d'information).
            Global Clean Tech n'exerce aucun contrôle sur leur contenu et décline toute responsabilité
            quant aux informations qui y sont publiées.
          </p>
        </Section>

        <Section num="7" title="Droit applicable">
          <p>
            Le présent site et ses mentions légales sont régis par le <strong>droit sénégalais</strong>.
            En cas de litige et à défaut de résolution amiable, les tribunaux sénégalais seront
            seuls compétents.
          </p>
        </Section>

        {/* Renvoi confidentialité */}
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="font-semibold text-dark text-sm">Protection de vos données personnelles</p>
            <p className="text-sm text-muted mt-0.5">
              Consultez notre politique de confidentialité pour savoir comment nous traitons vos données.
            </p>
          </div>
          <Link to="/confidentialite" className="btn-primary text-sm shrink-0">
            Lire la politique
          </Link>
        </div>
      </div>
    </main>
  )
}
