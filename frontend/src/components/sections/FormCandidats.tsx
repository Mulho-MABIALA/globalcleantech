import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false)
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

const POINTS = [
  'Formulaire en 3 étapes — moins de 5 minutes',
  'Réponse sous 48h ouvrables',
  'Vos données restent confidentielles',
]

export default function FormCandidats() {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref)

  return (
    <section id="candidats" ref={ref} className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(26,127,75,0.06)_0%,_transparent_60%)] pointer-events-none" />

      <div className={`max-w-3xl mx-auto px-5 sm:px-8 relative text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <span className="section-tag mb-4">Rejoignez-nous</span>
        <h2 className="section-title mt-3 mb-4">Espace candidats</h2>
        <p className="section-subtitle mb-10">
          Vous cherchez un emploi comme femme de ménage, nounou, chauffeur, gardien ou autre ?
          Déposez votre candidature en quelques minutes, notre équipe l'étudiera rapidement.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8 text-sm text-muted">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {p}
              </li>
            ))}
          </ul>

          <Link to="/postuler" className="btn-primary px-10 py-3.5 text-base inline-flex">
            Déposer ma candidature
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
