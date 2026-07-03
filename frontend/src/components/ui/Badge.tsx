import React from 'react'
import type { StatutCandidature } from '../../types/candidature'
import type { StatutDemande } from '../../types/demande'

type AnyStatut = StatutCandidature | StatutDemande

const CONFIG: Record<AnyStatut, { label: string; className: string }> = {
  a_traiter: { label: 'À traiter', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  place: { label: 'Placé(e)', className: 'bg-green-100 text-green-700 border-green-200' },
  archive: { label: 'Archivé', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  nouvelle: { label: 'Nouvelle', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  en_traitement: { label: 'En traitement', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  cloturee: { label: 'Clôturée', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

interface BadgeProps {
  status: AnyStatut
  className?: string
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const cfg = CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  )
}
