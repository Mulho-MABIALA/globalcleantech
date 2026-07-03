import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Candidature } from '../types/candidature'

interface ListParams {
  page?: number
  limit?: number
  statut?: string
  poste?: string
  search?: string
}

interface ListResponse {
  data: Candidature[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export function useCandidatures(params: ListParams = {}) {
  return useQuery({
    queryKey: ['candidatures', params],
    queryFn: async () => {
      const { data } = await api.get<ListResponse>('/candidatures', { params })
      return data
    },
  })
}

export function useCandidature(id: number) {
  return useQuery({
    queryKey: ['candidature', id],
    queryFn: async () => {
      const { data } = await api.get<Candidature>(`/candidatures/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateCandidature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; statut?: string; notesInternes?: string }) =>
      api.patch(`/candidatures/${id}`, body).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['candidature', vars.id] })
    },
  })
}

export function useDeleteCandidature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/candidatures/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidatures'] }),
  })
}
