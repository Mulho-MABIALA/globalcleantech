import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Message {
  id: number
  nom: string
  email: string
  telephone?: string
  sujet: string
  corps: string
  statut: 'non_lu' | 'lu' | 'archive'
  noteAdmin?: string
  createdAt: string
}

export function useMessages(params: { page?: number; statut?: string; search?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['messages', params],
    queryFn: () => api.get('/messages', { params }).then(r => r.data),
  })
}

export function useMessage(id: number) {
  return useQuery<Message>({
    queryKey: ['message', id],
    queryFn: () => api.get(`/messages/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useMessageStats() {
  return useQuery<{ nonLus: number }>({
    queryKey: ['message-stats'],
    queryFn: () => api.get('/messages/stats').then(r => r.data),
    refetchInterval: 60000,
  })
}

export function useUpdateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; statut?: string; noteAdmin?: string }) => api.patch(`/messages/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages'] }); qc.invalidateQueries({ queryKey: ['message-stats'] }) },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/messages/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages'] }); qc.invalidateQueries({ queryKey: ['message-stats'] }) },
  })
}
