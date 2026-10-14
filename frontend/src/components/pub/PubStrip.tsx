import React, { useEffect, useState } from 'react'
import { usePublicites, siteImageUrl, trackPubVue } from '../../hooks/usePublicites'
import PubLink, { PubTag } from './PubLink'

/** Bandeau publicitaire compact affiché sur toutes les pages publiques, au-dessus du footer. */
export default function PubStrip() {
  const { data: pubs = [] } = usePublicites('global')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (pubs.length <= 1) return
    const t = setInterval(() => setActive(i => (i + 1) % pubs.length), 7000)
    return () => clearInterval(t)
  }, [pubs.length])

  const pub = pubs[active % Math.max(pubs.length, 1)]

  useEffect(() => { if (pub) trackPubVue(pub.id) }, [pub?.id])

  if (!pub) return null

  return (
    <aside aria-label="Espace publicitaire" className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <PubLink key={pub.id} pub={pub} className="group flex items-center gap-4 rounded-xl bg-accent-light/60 hover:bg-accent-light transition-colors p-3 pr-4 animate-fade-in">
          {pub.imagePath && (
            <img src={siteImageUrl(pub.imagePath)} alt="" loading="lazy"
              className="w-20 h-14 sm:w-28 sm:h-16 object-cover rounded-lg shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <PubTag />
              {pub.annonceur && <span className="text-xs text-muted truncate">{pub.annonceur}</span>}
            </div>
            <p className="font-semibold text-dark font-display truncate mt-1">{pub.titre}</p>
            {pub.description && <p className="text-xs text-muted truncate hidden sm:block">{pub.description}</p>}
          </div>
          {pub.lien && (
            <span className="hidden sm:inline-flex shrink-0 text-sm font-semibold text-primary group-hover:underline">
              {pub.texteBouton || 'Découvrir'} →
            </span>
          )}
        </PubLink>
      </div>
    </aside>
  )
}
