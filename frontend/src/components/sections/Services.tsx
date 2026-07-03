import React, { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

interface Service {
  id: number
  titre: string
  description: string
  emoji: string   // utilisé comme clé d'icône
  couleur: string
  tags: string
  ordre: number
  actif: boolean
}

// Map icône-clé → SVG path
export const ICON_MAP: Record<string, React.ReactNode> = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  ),
  printer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  money: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.59 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
}

const COLOR_MAP: Record<string, { gradient: string; icon: string; tag: string; arrow: string }> = {
  emerald: { gradient: 'from-emerald-500 to-emerald-600', icon: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-500 group-hover:text-white', tag: 'bg-emerald-50 text-emerald-700 border-emerald-100', arrow: 'text-emerald-600' },
  blue:    { gradient: 'from-blue-500 to-blue-600',       icon: 'text-blue-600 bg-blue-50 group-hover:bg-blue-500 group-hover:text-white',       tag: 'bg-blue-50 text-blue-700 border-blue-100',       arrow: 'text-blue-600' },
  purple:  { gradient: 'from-purple-500 to-purple-600',   icon: 'text-purple-600 bg-purple-50 group-hover:bg-purple-500 group-hover:text-white',   tag: 'bg-purple-50 text-purple-700 border-purple-100',   arrow: 'text-purple-600' },
  amber:   { gradient: 'from-amber-500 to-amber-600',     icon: 'text-amber-600 bg-amber-50 group-hover:bg-amber-500 group-hover:text-white',     tag: 'bg-amber-50 text-amber-700 border-amber-100',     arrow: 'text-amber-600' },
  rose:    { gradient: 'from-rose-500 to-rose-600',       icon: 'text-rose-600 bg-rose-50 group-hover:bg-rose-500 group-hover:text-white',       tag: 'bg-rose-50 text-rose-700 border-rose-100',       arrow: 'text-rose-600' },
  teal:    { gradient: 'from-teal-500 to-teal-600',       icon: 'text-teal-600 bg-teal-50 group-hover:bg-teal-500 group-hover:text-white',       tag: 'bg-teal-50 text-teal-700 border-teal-100',       arrow: 'text-teal-600' },
  indigo:  { gradient: 'from-indigo-500 to-indigo-600',   icon: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-500 group-hover:text-white',   tag: 'bg-indigo-50 text-indigo-700 border-indigo-100',   arrow: 'text-indigo-600' },
  orange:  { gradient: 'from-orange-500 to-orange-600',   icon: 'text-orange-600 bg-orange-50 group-hover:bg-orange-500 group-hover:text-white',   tag: 'bg-orange-50 text-orange-700 border-orange-100',   arrow: 'text-orange-600' },
  pink:    { gradient: 'from-pink-500 to-pink-600',       icon: 'text-pink-600 bg-pink-50 group-hover:bg-pink-500 group-hover:text-white',       tag: 'bg-pink-50 text-pink-700 border-pink-100',       arrow: 'text-pink-600' },
}

// Mapping emoji legacy → clé d'icône
const EMOJI_TO_ICON: Record<string, string> = {
  '👥': 'users', '📢': 'megaphone', '🖨️': 'printer', '💸': 'money',
  '📋': 'clipboard', '⭐': 'star', '🏠': 'home', '💼': 'briefcase',
  '⚙️': 'settings', '📞': 'phone', '🛡️': 'shield', '⚡': 'zap',
}

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false)
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

const FALLBACK: Service[] = [
  { id: 1, titre: 'Placement de personnel', description: 'Femmes de ménage, nounous, cuisiniers, chauffeurs, gardiens, majordomes. Profils vérifiés et formés.', emoji: 'users', couleur: 'emerald', tags: 'Maison,Bureau,Entreprise', ordre: 1, actif: true },
  { id: 2, titre: 'Communication & Journalisme', description: 'Rédaction de contenu, relations presse, communication digitale et institutionnelle.', emoji: 'megaphone', couleur: 'blue', tags: 'Presse,Digital,RP', ordre: 2, actif: true },
  { id: 3, titre: 'Impression & Numérisation', description: 'Photocopie couleur et N&B, numérisation de documents, reliure, plastification.', emoji: 'printer', couleur: 'purple', tags: 'A4 / A3,Couleur,Numérique', ordre: 3, actif: true },
  { id: 4, titre: "Transfert d'argent", description: "Envoi et réception d'argent rapides et sécurisés pour particuliers et entreprises.", emoji: 'money', couleur: 'amber', tags: 'Rapide,Sécurisé,Fiable', ordre: 4, actif: true },
  { id: 5, titre: 'Services administratifs', description: 'Assistance aux démarches, rédaction de courriers, légalisation et certification de documents.', emoji: 'clipboard', couleur: 'rose', tags: 'Démarches,Courriers,Légalisation', ordre: 5, actif: true },
  { id: 6, titre: 'Sur mesure', description: 'Un besoin spécifique ? Nous construisons ensemble la solution adaptée.', emoji: 'star', couleur: 'teal', tags: 'Personnalisé,Flexible,Tout besoin', ordre: 6, actif: true },
]

export default function Services() {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref)

  const { data } = useQuery<Service[]>({
    queryKey: ['public-services'],
    queryFn: async () => { const { data } = await api.get('/public/services'); return data },
    staleTime: 5 * 60 * 1000,
  })

  const services = data ?? FALLBACK

  return (
    <section id="services" ref={ref} className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(26,127,75,0.05)_0%,_transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-10 sm:mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="section-tag mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Ce que nous proposons
          </span>
          <h2 className="section-title mt-3 mb-4">Nos services</h2>
          <p className="section-subtitle">
            Une gamme complète pour les particuliers, entreprises et institutions de la région de Thiès.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const colors = COLOR_MAP[s.couleur] ?? COLOR_MAP.emerald
            const tags = s.tags.split(',').map(t => t.trim()).filter(Boolean)
            // Résoudre l'icône : clé directe ou mapping depuis emoji
            const iconKey = ICON_MAP[s.emoji] ? s.emoji : (EMOJI_TO_ICON[s.emoji] ?? 'star')
            const icon = ICON_MAP[iconKey] ?? ICON_MAP.star

            return (
              <div
                key={s.id}
                className={`group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden
                  shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                  ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                {/* Bande colorée en haut */}
                <div className={`h-1 w-full bg-gradient-to-r ${colors.gradient}`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icône */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${colors.icon}`}>
                    {icon}
                  </div>

                  <h3 className="font-bold text-dark text-base mb-2 font-display leading-snug">
                    {s.titre}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed flex-1 mb-5">
                    {s.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${colors.tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className={`mt-14 text-center transition-all duration-700 delay-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a
            href="/#clients"
            onClick={(e) => { e.preventDefault(); document.getElementById('clients')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="btn-outline"
          >
            Faire une demande de service
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}


