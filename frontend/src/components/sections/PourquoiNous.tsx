import React, { useRef, useState, useEffect } from 'react'
import { useTemoignages } from '../../hooks/useTemoignages'

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

function Stars({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < note ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const ARGS = [
  {
    num: '01', title: 'Professionnalisme', accent: 'from-emerald-400/20 to-emerald-600/5', color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100',
    body: "Chaque candidat est soigneusement sélectionné, vérifié et accompagné. Nous garantissons un service de qualité à chaque placement.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/></svg>,
  },
  {
    num: '02', title: 'Réactivité', accent: 'from-blue-400/20 to-blue-600/5', color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
    body: "Vos demandes sont traitées en priorité. Un interlocuteur dédié vous répond sous 24h pour toute demande urgente.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>,
  },
  {
    num: '03', title: 'Confiance', accent: 'from-amber-400/20 to-amber-600/5', color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100',
    body: "Plus de 5 ans d'expérience à Thiès. Nos clients nous recommandent pour notre honnêteté et notre suivi attentif.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  },
]

export default function PourquoiNous() {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref)
  const [temoIdx, setTemoIdx] = useState(0)

  const { data: temoignages = [] } = useTemoignages()

  // Auto-rotate testimonials
  useEffect(() => {
    if (temoignages.length <= 1) return
    const t = setInterval(() => setTemoIdx(i => (i + 1) % temoignages.length), 5000)
    return () => clearInterval(t)
  }, [temoignages.length])

  const temo = temoignages[temoIdx]
  const initiale = temo?.nom?.[0]?.toUpperCase() ?? 'C'

  return (
    <section id="pourquoi" ref={ref} className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left */}
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="section-tag mb-4">Notre engagement</span>
            <h2 className="section-title mt-3 mb-5">
              Pourquoi choisir
              <span className="text-primary block">Global Clean Tech ?</span>
            </h2>
            <p className="section-subtitle mb-8">
              Nous construisons des relations durables basées sur la confiance, la transparence et l'excellence du service.
            </p>

            {/* Témoignage dynamique */}
            {temo ? (
              <div key={temo.id} className="bg-primary-light border border-primary/10 rounded-2xl p-5" style={{ animation: 'fade-in 0.5s ease' }}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl text-primary/40 font-serif leading-none mt-1">"</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark text-sm leading-relaxed italic">{temo.texte}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initiale}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-dark truncate">{temo.nom}</p>
                        <p className="text-[10px] text-muted truncate">{temo.role}</p>
                      </div>
                      <div className="ml-auto shrink-0">
                        <Stars note={temo.note} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dots rotation */}
                {temoignages.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {temoignages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTemoIdx(i)}
                        className={`rounded-full transition-all duration-300 ${i === temoIdx ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-primary/25 hover:bg-primary/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Skeleton loader */
              <div className="bg-primary-light border border-primary/10 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-primary/10 rounded mb-2 w-3/4" />
                <div className="h-4 bg-primary/10 rounded mb-4 w-1/2" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full" />
                  <div className="h-3 bg-primary/10 rounded w-24" />
                </div>
              </div>
            )}
          </div>

          {/* Right — argument cards */}
          <div className="space-y-4">
            {ARGS.map((a, i) => (
              <div
                key={a.num}
                className={`group relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-6
                  hover:border-primary/20 hover:shadow-lg transition-all duration-300
                  ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                style={{ transitionDelay: `${100 + i * 120}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${a.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${a.color}`}>
                    <span className="w-6 h-6">{a.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{a.num}</span>
                    <h3 className="font-semibold text-dark font-display mb-1.5 mt-0.5 group-hover:text-primary transition-colors">{a.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{a.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


