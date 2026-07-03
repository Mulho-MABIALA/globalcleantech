import React, { useState, useEffect } from 'react'
import { useTemoignages } from '../../hooks/useTemoignages'

function Stars({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < note ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const AVATAR_COLORS = ['bg-emerald-500','bg-blue-500','bg-purple-500','bg-amber-500','bg-rose-500','bg-teal-500']

export default function Temoignages() {
  const { data: temoignages = [] } = useTemoignages()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (temoignages.length <= 1) return
    const t = setInterval(() => setActive(i => (i + 1) % temoignages.length), 5000)
    return () => clearInterval(t)
  }, [temoignages.length])

  if (temoignages.length === 0) return null

  const featured = temoignages[active]
  const initiale = featured?.nom?.[0]?.toUpperCase() ?? 'C'
  const avatarColor = AVATAR_COLORS[active % AVATAR_COLORS.length]

  return (
    <section id="temoignages" className="py-24 bg-gradient-to-br from-dark via-[#0d2318] to-dark relative overflow-hidden">
      {/* Déco */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 relative">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            Témoignages
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display leading-tight">
            Ce que disent nos <span className="text-primary italic">clients</span>
          </h2>
        </div>

        {/* Témoignage principal */}
        <div className="max-w-3xl mx-auto mb-10">
          <div key={featured.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 text-center relative" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Guillemet déco */}
            <div className="absolute top-6 left-8 text-6xl text-primary/20 font-serif leading-none select-none">"</div>
            <div className="absolute bottom-6 right-8 text-6xl text-primary/20 font-serif leading-none select-none">"</div>

            <Stars note={featured.note} />
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed my-8 italic">
              "{featured.texte}"
            </p>

            {/* Avatar + info */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 ${avatarColor} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                {initiale}
              </div>
              <div>
                <p className="text-white font-bold font-display">{featured.nom}</p>
                <p className="text-white/40 text-sm">{featured.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots + aperçu miniatures */}
        {temoignages.length > 1 && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-2">
              {temoignages.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={`rounded-full transition-all duration-300 ${i === active ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>

            {/* Mini cartes */}
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
              {temoignages.filter((_, i) => i !== active).slice(0, 3).map((t, i) => (
                <button key={t.id} onClick={() => setActive(temoignages.indexOf(t))}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl px-4 py-2.5 transition-all duration-200 text-left">
                  <div className={`w-8 h-8 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {t.nom[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-semibold leading-tight">{t.nom}</p>
                    <Stars note={t.note} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </section>
  )
}


