import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePublicStats } from '../../hooks/usePublicStats'

/* ── CountUp ── */
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current || target === 0) return
    started.current = true
    const steps = 50
    const inc = target / steps
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.round(cur))
    }, 1800 / steps)
    return () => clearInterval(t)
  }, [target])
  return <>{val}{suffix}</>
}

/* ── Slides ── */
const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1920&q=80',
    tag: 'Personnel de maison',
    headline: 'Des profils vérifiés,\npour votre foyer.',
  },
  {
    img: 'https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?auto=format&fit=crop&w=1920&q=80',
    tag: 'Placement & Emploi',
    headline: 'Trouvez le bon\nprofil rapidement.',
  },
  {
    img: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1920&q=80',
    tag: 'Services professionnels',
    headline: 'Une seule agence\npour tous vos besoins.',
  },
  {
    img: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=1920&q=80',
    tag: 'Depuis 2019 · Thiès',
    headline: 'De confiance,\ndepuis 2019.',
  },
]

export default function Hero() {
  const { data: stats } = usePublicStats()
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const placements = stats ? Math.max(stats.placements, 500) : 500
  const clients    = stats ? Math.max(stats.clients, 150) : 150
  const annees     = stats?.annees ?? 5

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length)
        setTransitioning(false)
      }, 700)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const goTo = (i: number) => {
    if (i === current) return
    setTransitioning(true)
    setTimeout(() => { setCurrent(i); setTransitioning(false) }, 700)
  }

  return (
    <section id="accueil" className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex flex-col overflow-hidden bg-dark">

      {/* ── Slides fond ── */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? (transitioning ? 0 : 1) : 0 }}
        >
          {/* Photo */}
          <img
            src={s.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Couche sombre pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark/70 via-dark/60 to-dark/85" />
          {/* Accent vert gauche */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(26,127,75,0.45) 0%, transparent 55%)' }} />
          {/* Vignette bas */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark to-transparent" />
        </div>
      ))}

      {/* ── Contenu ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-10 sm:py-16 lg:py-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Texte */}
          <div className="max-w-xl">
            {/* Tag */}
            <div key={`tag-${current}`} className="mb-4" style={{ animation: 'slideIn 0.5s 0.1s both' }}>
              <span className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {SLIDES[current].tag}
              </span>
            </div>

            {/* Titre */}
            <h1
              key={`h1-${current}`}
              className="text-[2rem] sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4 whitespace-pre-line"
              style={{ animation: 'slideIn 0.55s 0.15s both' }}
            >
              {SLIDES[current].headline.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? 'text-primary italic block' : 'block'}>
                  {line}
                </span>
              ))}
            </h1>

            {/* Sous-titre */}
            <p className="text-white/55 text-sm sm:text-base max-w-md leading-relaxed mb-8" style={{ animation: 'slideIn 0.55s 0.22s both' }}>
              Personnel de maison vérifié, impression & communication, transfert d'argent — à Thiès, Sénégal.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3" style={{ animation: 'slideIn 0.55s 0.3s both' }}>
              <Link to="/postuler"
                className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Je postule
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button onClick={() => scrollTo('clients')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/18 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 backdrop-blur-sm text-sm">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Recruter du personnel
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2 mt-8" style={{ animation: 'slideIn 0.55s 0.38s both' }}>
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${i === current ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
              <span className="ml-2 text-white/25 text-[11px] font-mono">
                {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Cartes flottantes — masquées sur mobile, visibles md+ */}
          <div className="hidden md:flex flex-col gap-3" style={{ animation: 'fadeRight 0.8s 0.5s both' }}>
            {[
              { label: 'Femme de ménage', sub: 'Profils vérifiés', color: 'text-emerald-400',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5zM3 21a9 9 0 0118 0"/></svg> },
              { label: 'Nounou / Garde', sub: 'Expérimentées', color: 'text-blue-400',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z"/></svg> },
              { label: 'Cuisinier(ère)', sub: 'Cuisine locale & int.', color: 'text-amber-400',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg> },
              { label: 'Chauffeur', sub: 'Permis vérifié', color: 'text-rose-400',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg> },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white/8 border border-white/12 backdrop-blur-md rounded-2xl px-4 py-3 hover:bg-white/14 transition-all duration-200 cursor-default hover:border-primary/30 hover:-translate-x-1">
                <span className={`w-5 h-5 shrink-0 ${item.color}`}>{item.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{item.label}</p>
                  <p className="text-white/40 text-[11px]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Barre stats ── */}
      <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-12 lg:px-20 py-4 sm:py-5 grid grid-cols-3 gap-2 sm:gap-4 text-center divide-x divide-white/10">
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-display">
              <CountUp target={placements} suffix="+" />
            </p>
            <p className="text-[11px] text-white/35 mt-0.5 font-medium">Placements réalisés</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-display">
              <CountUp target={clients} suffix="+" />
            </p>
            <p className="text-[11px] text-white/35 mt-0.5 font-medium">Clients satisfaits</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-display">
              <CountUp target={annees} suffix="+ ans" />
            </p>
            <p className="text-[11px] text-white/35 mt-0.5 font-medium">D'expérience</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translate(40px, -50%); }
          to   { opacity: 1; transform: translate(0, -50%); }
        }
      `}</style>
    </section>
  )
}
