import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { OAuth2Client } from 'google-auth-library'
import { signToken } from '../utils/jwt'
import { AuthRequest } from '../middlewares/auth.middleware'

const prisma = new PrismaClient()
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

const USER_SELECT = { id: true, name: true, email: true, role: true, avatarPath: true, createdAt: true, updatedAt: true }

function deleteAvatarFile(avatarPath: string) {
  const file = path.resolve(UPLOAD_DIR, avatarPath)
  if (file.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(file)) {
    try { fs.unlinkSync(file) } catch { /* le fichier peut être verrouillé, on ne bloque pas la requête */ }
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string }

  if (!email || !password) {
    res.status(400).json({ message: 'Email et mot de passe requis.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ message: 'Identifiants incorrects.' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ message: 'Identifiants incorrects.' })
    return
  }

  const token = signToken({ id: user.id, role: user.role })

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

/**
 * Connexion via Google Identity Services : le front envoie l'ID token obtenu
 * après authentification Google, on le vérifie côté serveur puis on cherche
 * un compte existant portant cet email. Aucune création automatique de compte :
 * seuls les utilisateurs déjà créés par un admin (table User) peuvent se connecter.
 */
export async function loginWithGoogle(req: Request, res: Response) {
  const { credential } = req.body as { credential?: string }

  if (!credential) {
    res.status(400).json({ message: 'Jeton Google manquant.' })
    return
  }
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    res.status(503).json({ message: 'Connexion Google non configurée sur ce serveur.' })
    return
  }

  let email: string | undefined
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload?.email || !payload.email_verified) {
      res.status(401).json({ message: 'Adresse email Google non vérifiée.' })
      return
    }
    email = payload.email
  } catch {
    res.status(401).json({ message: 'Jeton Google invalide ou expiré.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(403).json({ message: "Aucun compte administrateur n'est associé à cette adresse Google." })
    return
  }

  const token = signToken({ id: user.id, role: user.role })
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: USER_SELECT,
  })
  if (!user) {
    res.status(404).json({ message: 'Utilisateur introuvable.' })
    return
  }
  res.json(user)
}

export async function updateAvatar(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: 'Aucune image reçue.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    deleteAvatarFile(path.join('avatars', req.file.filename))
    res.status(404).json({ message: 'Utilisateur introuvable.' })
    return
  }

  if (user.avatarPath) deleteAvatarFile(user.avatarPath)

  const avatarPath = `avatars/${req.file.filename}`
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarPath },
    select: USER_SELECT,
  })
  res.json(updated)
}

export async function deleteAvatar(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ message: 'Utilisateur introuvable.' })
    return
  }

  if (user.avatarPath) deleteAvatarFile(user.avatarPath)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarPath: null },
    select: USER_SELECT,
  })
  res.json(updated)
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { name, email } = req.body as { name?: string; email?: string }

  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ message: 'Nom et email requis.' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Adresse email invalide.' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.id !== req.user!.id) {
    res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' })
    return
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: name.trim(), email: email.trim() },
    select: USER_SELECT,
  })
  res.json(user)
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ message: 'Utilisateur introuvable.' })
    return
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    // 400 et non 401 : l'intercepteur axios du front déconnecte sur 401
    res.status(400).json({ message: 'Mot de passe actuel incorrect.' })
    return
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  res.json({ message: 'Mot de passe modifié avec succès.' })
}

export function logout(_req: Request, res: Response) {
  res.json({ message: 'Déconnexion réussie.' })
}
