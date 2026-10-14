import React, { useEffect, useState } from 'react'
import { usePublicites, siteImageUrl, trackPubVue } from '../../hooks/usePublicites'
import PubLink, { PubTag } from './PubLink'

/** Carrousel publicitaire de la page d'accueil (emplacement "accueil"). */
export default function PubBanner() {
  const { data: pubs = [] } = usePublicites('accueil')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (pubs.length <= 1) return
    const t = setInterval(() => setActive(i => (i + 1) % pubs.length), 6000)
    return () => clearInterval(t)
  }, [pubs.length])

  const pub = pubs[active % Math.max(pubs.length, 1)]

  useEffect(() => { if (pub) trackPubVue(pub.id) }, [pub?.id])

  if (!pub) return null

  return (
    <section aria-label="Espace publicitaire" className="py-10 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <PubLink pub={pub} className="group relative block overflow-hidden rounded-2xl shadow-sm bg-white">
          <div key={pub.id} className="grid md:grid-cols-5 animate-fade-in">
            <div className="md:col-span-3 relative aspect-[16/7] md:aspect-auto md:min-h-[240px] bg-gray-100">
              {pub.imagePath && (
                <img src={siteImageUrl(pub.imagePath)} alt={pub.titre} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              )}
              <PubTag className="absolute top-3 left-3" />
            </div>
            <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center gap-3">
              {pub.annonceur && <p className="text-xs font-semibold text-accent uppercase tracking-wide">{pub.annonceur}</p>}
              <h3 className="text-xl md:text-2xl font-black font-display text-dark leading-tight">{pub.titre}</h3>
              {pub.description && <p className="text-muted text-sm leading-relaxed line-clamp-4">{pub.description}</p>}
              {pub.lien && (
                <span className="btn-primary self-start text-sm py-2 mt-1">{pub.texteBouton || 'En savoir plus'}</span>
              )}
            </div>
          </div>
        </PubLink>

        {pubs.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {pubs.map((p, i) => (
              <button key={p.id} type="button" aria-label={`Publicité ${i + 1}`} onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${i === active % pubs.length ? 'w-6 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
