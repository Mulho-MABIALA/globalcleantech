import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

const SOCIALS = [
  {
    label: 'Facebook',
    href: () => import.meta.env.VITE_FACEBOOK_URL,
    bg: 'bg-[#1877F2] hover:bg-[#1557c0]',
    icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  },
  {
    label: 'X',
    href: () => import.meta.env.VITE_TWITTER_URL,
    bg: 'bg-black hover:bg-gray-800 ring-1 ring-white/15',
    icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  },
  {
    label: 'WhatsApp',
    href: () => `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`,
    bg: 'bg-[#25D366] hover:bg-[#1da851]',
    icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />,
  },
]

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await api.post('/public/newsletter', { email })
      setDone(true)
      toast.success('Inscription confirmée !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Merci ! Vous êtes bien inscrit(e).
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Votre email"
        required
        className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-400 text-sm pl-10 pr-24 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.14] transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? '…' : "S'inscrire"}
      </button>
    </form>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-[#0F1B2D] to-[#0A1120] text-white">
      {/* Liseré de marque */}
      <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-accent" />

      <div className="border-b border-white/10 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Marque */}
            <div>
              <Link to="/" className="inline-flex items-center gap-3 mb-5">
                {/* Pastille blanche : le logo garde ses couleurs d'origine sur fond sombre */}
                <span className="bg-white rounded-2xl p-2 shadow-lg shadow-black/20 inline-flex">
                  <img src="/logo.png" alt="Global Clean Tech" className="h-10 w-auto object-contain" />
                </span>
              </Link>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Votre partenaire de confiance pour le placement de personnel, la communication et les services à Thiès, Sénégal.
              </p>
              <div className="flex gap-2.5">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${s.bg}`}
                  >
                    <svg className="w-[18px] h-[18px] fill-white" viewBox="0 0 24 24">{s.icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider font-display">Navigation</h4>
              <span className="block w-8 h-0.5 bg-primary rounded-full mt-2 mb-5" />
              <ul className="space-y-3">
                {[
                  { href: '/#services', label: 'Nos services' },
                  { href: '/#candidats', label: 'Espace candidats' },
                  { href: '/#clients', label: 'Espace clients' },
                  { href: '/a-propos', label: 'À propos' },
                  { href: '/#contact', label: 'Contact' },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-gray-300 hover:text-emerald-300 transition-all duration-150 inline-flex items-center gap-2 group">
                      <svg className="w-3 h-3 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider font-display">Contactez-nous</h4>
              <span className="block w-8 h-0.5 bg-primary rounded-full mt-2 mb-5" />
              <ul className="space-y-3.5">
                {[
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />, text: 'Quartier Médina Fall, Thiès, Sénégal' },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />, text: '+221 75 642 26 00', href: 'tel:+221756422600' },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />, text: '+221 77 350 18 25', href: 'tel:+221773501825' },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, text: 'contact@globalcleantech.sn', href: 'mailto:contact@globalcleantech.sn' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
                    </span>
                    {item.href
                      ? <a href={item.href} className="hover:text-emerald-300 transition-colors leading-snug">{item.text}</a>
                      : <span className="leading-snug">{item.text}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter + horaires */}
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider font-display">Newsletter</h4>
              <span className="block w-8 h-0.5 bg-primary rounded-full mt-2 mb-4" />
              <p className="text-sm text-gray-300 mb-4">Conseils emploi et actualités de l'agence, une fois par mois.</p>
              <NewsletterForm />

              <div className="mt-6 p-4 bg-white/[0.06] rounded-xl border border-white/10">
                <p className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-widest mb-2.5">Horaires</p>
                <div className="space-y-1.5 text-sm text-gray-300">
                  <div className="flex justify-between"><span>Lun – Ven</span><span className="text-white font-medium">8h – 18h</span></div>
                  <div className="flex justify-between"><span>Samedi</span><span className="text-white font-medium">9h – 14h</span></div>
                  <div className="flex justify-between"><span>Dimanche</span><span className="text-gray-500">Fermé</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bas de page */}
      <div className="py-5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <p>© {year} <span className="text-white font-medium">Global Clean Tech</span>. Tous droits réservés.</p>
          <a
            href="https://zolaa.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            Créé par
            <span className="font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">Zolaa Tech</span>
            <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <div className="flex gap-5">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
