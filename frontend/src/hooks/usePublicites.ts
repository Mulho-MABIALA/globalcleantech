import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export type EmplacementPub = 'accueil' | 'popup' | 'global'

export interface PublicitePublic {
  id: number
  titre: string
  description: string | null
  annonceur: string | null
  imagePath: string | null
  lien: string | null
  texteBouton: string | null
  emplacement: EmplacementPub
}

export interface Publicite extends PublicitePublic {
  dateDebut: string | null
  dateFin: string | null
  ordre: number
  actif: boolean
  vues: number
  clics: number
  createdAt: string
}

export const EMPLACEMENT_LABELS: Record<EmplacementPub, string> = {
  accueil: "Bandeau page d'accueil",
  popup: "Popup à l'arrivée",
  global: 'Bandeau toutes les pages',
}

/** URL publique d'une image stockée dans uploads/site (même logique que la photo À propos). */
export function siteImageUrl(file?: string | null): string | undefined {
  if (!file) return undefined
  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
  return `${base}/public/site-images/${file}`
}

export function usePublicites(emplacement: EmplacementPub) {
  return useQuery<PublicitePublic[]>({
    queryKey: ['public-publicites', emplacement],
    queryFn: () => api.get('/public/publicites', { params: { emplacement } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

// ── Suivi des performances ──────────────────────────────────────────────────
// Une vue est comptée au maximum une fois par pub et par session de navigation.
const SEEN_KEY = 'gct_pub_vues'

function readSeen(): number[] {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}

export function trackPubVue(id: number) {
  const seen = readSeen()
  if (seen.includes(id)) return
  try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id])) } catch { /* navigation privée */ }
  api.post(`/public/publicites/${id}/vue`).catch(() => {})
}

export function trackPubClic(id: number) {
  api.post(`/public/publicites/${id}/clic`).catch(() => {})
}
