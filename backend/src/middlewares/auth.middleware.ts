import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

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
