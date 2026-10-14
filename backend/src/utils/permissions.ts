// Système de permissions par page pour les utilisateurs "gestionnaire".
// Un admin (role === 'admin') a toujours accès à tout et n'est jamais concerné
// par ces vérifications (voir requirePermission dans auth.middleware.ts).

export const PERMISSION_MODULES = [
  'candidatures',
  'demandes',
  'placements',
  'messages',
  'temoignages',
  'newsletter',
  'actualites',
  'services',
  'contenu',
  'publicites',
  'utilisateurs',
] as const

export type PermissionModule = (typeof PERMISSION_MODULES)[number]
export type PermissionLevel = 'none' | 'read' | 'edit'
export type PermissionsMap = Partial<Record<PermissionModule, PermissionLevel>>

const LEVEL_RANK: Record<PermissionLevel, number> = { none: 0, read: 1, edit: 2 }

export function hasPermission(
  perms: PermissionsMap | null | undefined,
  module: PermissionModule,
  min: PermissionLevel
): boolean {
  const level = perms?.[module] ?? 'none'
  return LEVEL_RANK[level] >= LEVEL_RANK[min]
}

// Permissions par défaut d'un nouveau "gestionnaire" : accès en modification à toutes
// les pages métier, mais pas d'accès à la gestion des utilisateurs (à activer explicitement).
export function defaultPermissions(): PermissionsMap {
  const perms: PermissionsMap = {}
  for (const m of PERMISSION_MODULES) perms[m] = m === 'utilisateurs' ? 'none' : 'edit'
  return perms
}

export function isValidPermissionsMap(value: unknown): value is PermissionsMap {
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as Record<string, unknown>).every(
    ([key, val]) =>
      (PERMISSION_MODULES as readonly string[]).includes(key) &&
      (val === 'none' || val === 'read' || val === 'edit')
  )
}
