import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export type TypeNotification = 'candidature' | 'demande' | 'message' | 'candidature_statut' | 'placement' | 'systeme'

export interface Notification {
  id: number
  type: TypeNotification
  titre: string
  message: string
  lien?: string | null
  lu: boolean
  createdAt: string
}

interface NotificationsResponse {
  data: Notification[]
  meta: { total: number; page: number; pages: number }
}

export function useNotifications(params: { page?: number; limit?: number } = {}) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', params],
    queryFn: () => api.get('/notifications', { params }).then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useNotificationStats() {
  return useQuery<{ nonLues: number }>({
    queryKey: ['notification-stats'],
    queryFn: () => api.get('/notifications/stats').then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-stats'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-stats'] })
    },
  })
}
