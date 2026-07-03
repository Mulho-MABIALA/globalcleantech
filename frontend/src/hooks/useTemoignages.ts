import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Temoignage {
  id: number
  nom: string
  role: string
  texte: string
  note: number
  actif: boolean
  ordre: number
  createdAt: string
}

export function useTemoignages() {
  return useQuery<Temoignage[]>({
    queryKey: ['temoignages'],
    queryFn: () => api.get('/temoignages').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useTemoignagesAdmin() {
  return useQuery<Temoignage[]>({
    queryKey: ['temoignages-admin'],
    queryFn: () => api.get('/temoignages/admin').then(r => r.data),
  })
}

export function useCreateTemoignage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Temoignage, 'id' | 'createdAt'>) => api.post('/temoignages', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['temoignages-admin'] }); qc.invalidateQueries({ queryKey: ['temoignages'] }) },
  })
}

export function useUpdateTemoignage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Temoignage> & { id: number }) => api.patch(`/temoignages/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['temoignages-admin'] }); qc.invalidateQueries({ queryKey: ['temoignages'] }) },
  })
}

export function useDeleteTemoignage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/temoignages/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['temoignages-admin'] }); qc.invalidateQueries({ queryKey: ['temoignages'] }) },
  })
}
