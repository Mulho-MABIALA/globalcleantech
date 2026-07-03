import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Demande } from '../types/demande'

interface ListParams {
  page?: number
  limit?: number
  statut?: string
  service?: string
  search?: string
}

interface ListResponse {
  data: Demande[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export function useDemandes(params: ListParams = {}) {
  return useQuery({
    queryKey: ['demandes', params],
    queryFn: async () => {
      const { data } = await api.get<ListResponse>('/demandes', { params })
      return data
    },
  })
}

export function useDemande(id: number) {
  return useQuery({
    queryKey: ['demande', id],
    queryFn: async () => {
      const { data } = await api.get<Demande>(`/demandes/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateDemande() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; statut?: string; notesInternes?: string }) =>
      api.patch(`/demandes/${id}`, body).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['demandes'] })
      qc.invalidateQueries({ queryKey: ['demande', vars.id] })
    },
  })
}

export function useDeleteDemande() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/demandes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demandes'] }),
  })
}
