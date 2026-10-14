import React from 'react'
import { Link } from 'react-router-dom'
import { PublicitePublic, trackPubClic } from '../../hooks/usePublicites'

interface Props {
  pub: PublicitePublic
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

/** Enveloppe cliquable d'une pub : lien interne (React Router) ou externe (nouvel onglet). */
export default function PubLink({ pub, className, children, onClick }: Props) {
  const handle = () => { trackPubClic(pub.id); onClick?.() }

  if (!pub.lien) return <div className={className}>{children}</div>

  if (pub.lien.startsWith('/')) {
    return <Link to={pub.lien} onClick={handle} className={className}>{children}</Link>
  }
  return (
    <a href={pub.lien} target="_blank" rel="noopener noreferrer sponsored" onClick={handle} className={className}>
      {children}
    </a>
  )
}

export function PubTag({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold bg-black/55 text-white px-2 py-0.5 rounded ${className}`}>
      Publicité
    </span>
  )
}
