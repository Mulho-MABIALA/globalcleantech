import React, { useEffect, useState } from 'react'
import { usePublicites, siteImageUrl, trackPubVue } from '../../hooks/usePublicites'
import PubLink, { PubTag } from './PubLink'

const CLOSED_KEY = 'gct_pub_popup_fermee'
const DELAY_MS = 2500

function alreadyClosed(): boolean {
  try { return sessionStorage.getItem(CLOSED_KEY) === '1' } catch { return false }
}

/** Popup publicitaire affichée une seule fois par session, quelques secondes après l'arrivée. */
export default function PubPopup() {
  const { data: pubs = [] } = usePublicites('popup')
  const [open, setOpen] = useState(false)
  const pub = pubs[0] // la mieux classée (ordre le plus bas)

  useEffect(() => {
    if (!pub || alreadyClosed()) return
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [pub?.id])

  useEffect(() => { if (open && pub) trackPubVue(pub.id) }, [open, pub?.id])

  const close = () => {
    setOpen(false)
    try { sessionStorage.setItem(CLOSED_KEY, '1') } catch { /* navigation privée */ }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open || !pub) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={close}>
      <div role="dialog" aria-modal="true" aria-label={pub.titre}
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <button type="button" onClick={close} aria-label="Fermer la publicité"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-dark shadow flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <PubLink pub={pub} onClick={close} className="block">
          {pub.imagePath && (
            <div className="relative bg-gray-100">
              <img src={siteImageUrl(pub.imagePath)} alt={pub.titre} className="w-full max-h-[60vh] object-cover" />
              <PubTag className="absolute top-3 left-3" />
            </div>
          )}
          <div className="p-5 space-y-2">
            {pub.annonceur && <p className="text-xs font-semibold text-accent uppercase tracking-wide">{pub.annonceur}</p>}
            <h3 className="text-lg font-black font-display text-dark">{pub.titre}</h3>
            {pub.description && <p className="text-sm text-muted">{pub.description}</p>}
            {pub.lien && <span className="btn-primary inline-flex text-sm py-2 mt-2">{pub.texteBouton || 'En savoir plus'}</span>}
          </div>
        </PubLink>
      </div>
    </div>
  )
}
