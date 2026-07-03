import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Me {
  id: number
  name: string
  email: string
  role: 'admin' | 'gestionnaire'
  avatarPath: string | null
  createdAt: string
  updatedAt: string
}

export function useMe() {
  return useQuery<Me>({ queryKey: ['me'], queryFn: () => api.get('/auth/me').then(r => r.data) })
}

/**
 * Les fichiers uploadés sont servis derrière l'auth (header Authorization),
 * donc pas d'<img src> direct : on récupère un blob et on expose une object URL.
 */
export function useAvatarUrl(avatarPath?: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!avatarPath) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false

    const parts = avatarPath.replace(/\\/g, '/').split('/')
    const filename = parts.pop()
    const folder = parts.join('/')
    if (!filename || !folder) {
      setUrl(null)
      return
    }

    api.get(`/uploads/${folder}/${filename}`, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
      })
      .catch(() => { if (!cancelled) setUrl(null) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [avatarPath])

  return url
}
