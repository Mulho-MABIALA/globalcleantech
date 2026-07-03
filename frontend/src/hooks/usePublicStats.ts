import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface PublicStats {
  placements: number
  clients: number
  candidats: number
  services: number
  annees: number
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: () => axios.get('/api/public/stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
