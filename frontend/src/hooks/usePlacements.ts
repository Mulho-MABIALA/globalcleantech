import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Placement {
  id: number
  candidatureId: number
  demandeId: number | null
  dateDebut: string
  dateFin: string | null
  salaire: string | null
  notes: string | null
  createdAt: string
  candidature: { id: number; nomComplet: string; posteSouhaite: string; photoPath?: string | null }
  demande: { id: number; nomRaisonSociale: string; serviceSouhaite: string } | null
}

export function usePlacements(params: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['placements', params],
    queryFn: () => api.get('/placements', { params }).then(r => r.data),
  })
}

export function usePlacementsByCandidature(candidatureId: number) {
  return useQuery<Placement[]>({
    queryKey: ['placements-candidature', candidatureId],
    queryFn: () => api.get(`/placements/candidature/${candidatureId}`).then(r => r.data),
    enabled: !!candidatureId,
  })
}

export function useCreatePlacement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Placement> & { candidatureId: number; dateDebut: string }) =>
      api.post('/placements', data).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['placements'] })
      qc.invalidateQueries({ queryKey: ['placements-candidature', vars.candidatureId] })
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeletePlacement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/placements/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['placements'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
