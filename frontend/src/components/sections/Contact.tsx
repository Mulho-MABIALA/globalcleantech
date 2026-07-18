import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ICON_MAP } from './Services'
import ContactForm from './ContactForm'

interface Actualite {
  id: number
  titre: string
  description: string
  categorie: string
  couleur: string
  icone: string
  lien?: string | null
}

const COLOR_MAP: Record<string, { bg: string; text: string; tag: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', tag: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    tag: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  tag: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-400' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   tag: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    tag: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-400' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    tag: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-400' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  tag: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-400' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  tag: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-400' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    tag: 'bg-pink-100 text-pink-700',       dot: 'bg-pink-400' },
}

const FALLBACK: Actualite[] = [
  { id: 1, titre: 'Comment bien préparer son entretien ?', description: 'Nos conseils pour faire bonne impression dès la première rencontre.', categorie: 'Conseils emploi', couleur: 'emerald', icone: 'users' },
  { id: 2, titre: 'Transfert d\'argent : les délais expliqués', description: 'Tout ce qu\'il faut savoir sur les délais et conditions.', categorie: 'Services', couleur: 'amber', icone: 'money' },
  { id: 3, titre: 'Profils les plus demandés en 2024', description: 'Découvrez quels profils sont les plus recherchés par nos clients.', categorie: 'Marché emploi', couleur: 'blue', icone: 'briefcase' },
  { id: 4, titre: 'Impression : tarifs & formats disponibles', description: 'Photocopies couleur, reliure, plastification à Thiès.', categorie: 'Services', couleur: 'purple', icone: 'printer' },
  { id: 5, titre: 'Travailler dans une famille : droits & devoirs', description: 'Guide pratique pour les travailleurs domestiques.', categorie: 'Guide pratique', couleur: 'rose', icone: 'shield' },
  { id: 6, titre: 'Pourquoi choisir une agence de placement ?', description: 'Les avantages d\'un recrutement via Global Clean Tech.', categorie: 'Conseils', couleur: 'teal', icone: 'star' },
]

const EMAIL_ICON = (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)
const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)
const FACEBOOK_ICON = (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)
const INSTAGRAM_ICON = (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
  </svg>
)

const CHANNELS = [
  { label: 'Email', value: 'contact@globalcleantechsn.com', href: 'mailto:contact@globalcleantechsn.com', icon: EMAIL_ICON, iconColor: 'text-primary group-hover:text-white', color: 'hover:border-primary', bg: 'group-hover:bg-primary' },
  { label: 'WhatsApp', value: 'Message rapide', href: () => `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Bonjour%20Global%20Clean%20Tech`, icon: WHATSAPP_ICON, iconColor: 'text-[#25D366] group-hover:text-white', color: 'hover:border-[#25D366]', bg: 'group-hover:bg-[#25D366]' },
  { label: 'Facebook', value: 'Global Clean Tech', href: () => import.meta.env.VITE_FACEBOOK_URL, icon: FACEBOOK_ICON, iconColor: 'text-[#1877F2] group-hover:text-white', color: 'hover:border-[#1877F2]', bg: 'group-hover:bg-[#1877F2]' },
  { label: 'Instagram', value: '@global_clean_tech', href: () => import.meta.env.VITE_INSTAGRAM_URL, icon: INSTAGRAM_ICON, iconColor: 'text-[#E4405F] group-hover:text-white', color: 'hover:border-[#E4405F]', bg: 'group-hover:bg-[#E4405F]' },
]

function ActualiteCard({ a }: { a: Actualite }) {
  const colors = COLOR_MAP[a.couleur] ?? COLOR_MAP.emerald
  const icon = ICON_MAP[a.icone] ?? ICON_MAP.star
  const Tag = a.lien ? 'a' : 'div'
  return (
    <Tag
      {...(a.lien ? { href: a.lien, target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`flex flex-col gap-3 w-72 shrink-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${a.lien ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
          <span className="w-5 h-5">{icon}</span>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors.tag}`}>
          {a.categorie}
        </span>
      </div>
      <div>
        <p className="font-bold text-dark text-sm font-display leading-snug mb-1.5">{a.titre}</p>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{a.description}</p>
      </div>
      {a.lien && (
        <span className={`text-xs font-semibold flex items-center gap-1 ${colors.text} mt-auto`}>
          Lire la suite
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </span>
      )}
    </Tag>
  )
}

export default function Contact() {
  const { data } = useQuery<Actualite[]>({
    queryKey: ['public-actualites'],
    queryFn: async () => { const { data } = await api.get('/public/actualites'); return data },
    staleTime: 5 * 60 * 1000,
  })

  const actualites = data && data.length > 0 ? data : FALLBACK
  // Dupliquer pour l'effet infini
  const loop = [...actualites, ...actualites, ...actualites]

  return (
    <section id="contact" className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(26,127,75,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 relative">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="section-tag mb-4">Restons en contact</span>
          <h2 className="section-title mt-3 mb-3">Nous sommes à votre écoute</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Choisissez le canal qui vous convient. Nous répondons en général en moins de 2h.
          </p>
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 sm:mb-16">
          {CHANNELS.map((c) => {
            const href = typeof c.href === 'function' ? c.href() : c.href
            return (
              <a
                key={c.label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`group flex flex-col items-center text-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 transition-all duration-300 ${c.color} hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-xl bg-surface flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${c.bg} ${c.iconColor}`}>
                  {c.icon}
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className="font-semibold text-dark text-sm font-display">{c.label}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">{c.value}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Formulaire de contact ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 mb-10 sm:mb-16">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Info latérale */}
            <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark p-6 sm:p-8 text-white">
              <h3 className="text-xl font-black font-display mb-2">Écrivez-nous</h3>
              <p className="text-white/60 text-sm mb-8">Réponse garantie en moins de 48h ouvrables.</p>
              <div className="space-y-4">
                {([
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>, text: 'Quartier Médina Fall, Thiès' },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>,
                    node: (
                      <span className="text-white/75 text-sm mt-2 space-x-2">
                        <a href="tel:+221756422600" className="hover:text-white transition-colors">+221 75 642 26 00</a>
                        <span>·</span>
                        <a href="tel:+221773501825" className="hover:text-white transition-colors">+221 77 350 18 25</a>
                      </span>
                    ),
                  },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>, text: 'contact@globalcleantechsn.com' },
                ] as { icon: React.ReactElement; text?: string; node?: React.ReactElement }[]).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{item.icon}</svg>
                    </div>
                    {item.node ?? <span className="text-white/75 text-sm mt-2">{item.text}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/15">
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-3">Horaires</p>
                <p className="text-sm text-white/70">Lun–Ven : 8h–18h</p>
                <p className="text-sm text-white/70">Samedi : 9h–14h</p>
              </div>
            </div>
            {/* Formulaire */}
            <div className="lg:col-span-3 p-5 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>

      {/* ── Suivi candidature lien ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 mb-10">
        <a href="/statut-candidature" className="flex items-center justify-between gap-4 bg-white border border-primary/20 rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            </div>
            <div>
              <p className="font-semibold text-dark text-sm font-display">Vous avez déjà postulé ?</p>
              <p className="text-xs text-muted">Vérifiez le statut de votre candidature avec votre numéro de téléphone</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-primary shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>

      {/* ── Carrousel infini ── */}
      <div className="relative mb-0 -mx-0">
        {/* Titre */}
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 mb-6 flex items-center gap-3">
          <span className="section-tag">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Actualités & Conseils
          </span>
        </div>

        {/* Fade masks */}
        <div className="absolute left-0 top-12 bottom-0 w-24 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-12 bottom-0 w-24 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />

        {/* Piste défilante */}
        <div className="overflow-hidden">
          <div
            className="flex gap-4 py-2"
            style={{
              width: 'max-content',
              animation: 'marquee 40s linear infinite',
            }}
          >
            {loop.map((a, i) => (
              <ActualiteCard key={`${a.id}-${i}`} a={a} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .overflow-hidden:hover div[style] {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}




