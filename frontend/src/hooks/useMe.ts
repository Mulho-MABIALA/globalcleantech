import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export const PERMISSION_MODULES = [
  'candidatures', 'demandes', 'placements', 'messages',
  'temoignages', 'newsletter', 'actualites', 'services',
  'contenu', 'publicites', 'utilisateurs',
] as const
export type PermissionModule = (typeof PERMISSION_MODULES)[number]
export type PermissionLevel = 'none' | 'read' | 'edit'
export type PermissionsMap = Partial<Record<PermissionModule, PermissionLevel>>

export interface Me {
  id: number
  name: string
  email: string
  role: 'admin' | 'gestionnaire'
  permissions: PermissionsMap | null
  avatarPath: string | null
  createdAt: string
  updatedAt: string
}

export function useMe() {
  return useQuery<Me>({ queryKey: ['me'], queryFn: () => api.get('/auth/me').then(r => r.data) })
}

const LEVEL_RANK: Record<PermissionLevel, number> = { none: 0, read: 1, edit: 2 }

/**
 * Vrai si `me` a au moins le niveau `min` sur `module`. Un admin a toujours accès à tout.
 */
export function hasPermission(me: Me | undefined, module: PermissionModule, min: PermissionLevel = 'read'): boolean {
  if (!me) return false
  if (me.role === 'admin') return true
  const level = me.permissions?.[module] ?? 'none'
  return LEVEL_RANK[level] >= LEVEL_RANK[min]
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
