import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../utils/jwt'
import { PermissionModule, PermissionLevel, PermissionsMap, hasPermission } from '../utils/permissions'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: { id: number; role: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide.' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyToken(token)
    req.user = { id: payload.id, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Token expiré ou invalide.' })
  }
}

/**
 * Comme authMiddleware, mais ne bloque jamais la requête : si un token Bearer
 * valide est présent, req.user est renseigné (utile pour distinguer un envoi
 * admin authentifié d'un envoi public anonyme sur une route ouverte).
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.split(' ')[1])
      req.user = { id: payload.id, role: payload.role }
    } catch {
      // token invalide/expiré : on continue simplement sans req.user
    }
  }
  next()
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Accès réservé aux administrateurs.' })
    return
  }
  next()
}

/**
 * Vérifie qu'un utilisateur authentifié a au moins le niveau de permission demandé
 * sur un module (page) donné. Les admins passent toujours (accès total, non
 * configurable). À utiliser après authMiddleware.
 */
export function requirePermission(module: PermissionModule, min: PermissionLevel) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié.' })
      return
    }
    if (req.user.role === 'admin') {
      next()
      return
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { permissions: true } })
    const perms = (user?.permissions as PermissionsMap | null) ?? null
    if (!hasPermission(perms, module, min)) {
      res.status(403).json({ message: "Vous n'avez pas la permission d'accéder à cette page." })
      return
    }
    next()
  }
}

/**
 * Variante pour les routes à double usage (public ET admin, ex: création de
 * candidature). Si la requête est anonyme (pas de req.user), elle passe sans
 * vérification — la route est censée être publique dans ce cas. Si un
 * utilisateur est authentifié, la permission est bien vérifiée.
 */
export function requirePermissionIfAuthed(module: PermissionModule, min: PermissionLevel) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      next()
      return
    }
    if (req.user.role === 'admin') {
      next()
      return
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { permissions: true } })
    const perms = (user?.permissions as PermissionsMap | null) ?? null
    if (!hasPermission(perms, module, min)) {
      res.status(403).json({ message: "Vous n'avez pas la permission d'effectuer cette action." })
      return
    }
    next()
  }
}
