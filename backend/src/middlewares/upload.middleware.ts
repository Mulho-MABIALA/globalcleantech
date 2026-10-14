import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { Request, Response, NextFunction } from 'express'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

const tmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = path.join(UPLOAD_DIR, 'candidatures', 'tmp')
    fs.mkdirSync(tmpDir, { recursive: true })
    cb(null, tmpDir)
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

// Beaucoup de candidats n'ont qu'une photo de leur CV sur le téléphone : on l'accepte aussi.
const cvFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp']
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('Le CV doit être un fichier PDF, Word ou une photo (JPG, PNG).'))
}

const photoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('La photo doit être un fichier JPG, PNG ou WEBP (les photos iPhone .HEIC ne sont pas acceptées).'))
}

const cniFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('La pièce d\'identité doit être JPG, PNG ou PDF.'))
}

const MAX_CV_SIZE = 5 * 1024 * 1024
const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const MAX_CNI_SIZE = 5 * 1024 * 1024

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, 'avatars')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `avatar-${unique}${path.extname(file.originalname).toLowerCase()}`)
  },
})

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_PHOTO_SIZE },
  fileFilter: photoFilter,
}).single('avatar')

// Images du site public (ex: photo équipe sur la page À propos). Servies sans
// authentification (voir app.ts), donc dossier dédié séparé des documents privés.
const siteImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, 'site')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `site-${unique}${path.extname(file.originalname).toLowerCase()}`)
  },
})

export const uploadSiteImage = multer({
  storage: siteImageStorage,
  limits: { fileSize: MAX_PHOTO_SIZE },
  fileFilter: photoFilter,
}).single('photo')

// Visuels des espaces publicitaires : même dossier public que les images du site.
export const uploadPubImage = multer({
  storage: siteImageStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: photoFilter,
}).single('image')

const candidatureMulter = multer({
  storage: tmpStorage,
  limits: { fileSize: Math.max(MAX_CV_SIZE, MAX_CNI_SIZE) },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cv') cvFilter(req, file, cb)
    else if (file.fieldname === 'photo') photoFilter(req, file, cb)
    else if (file.fieldname === 'cniRecto' || file.fieldname === 'cniVerso' || file.fieldname === 'permis') cniFilter(req, file, cb)
    else cb(null, false)
  },
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'cniRecto', maxCount: 1 },
  { name: 'cniVerso', maxCount: 1 },
  { name: 'permis', maxCount: 1 },
])

const CANDIDATURE_FIELD_LABELS: Record<string, string> = {
  cv: 'Le CV',
  photo: 'La photo de profil',
  cniRecto: "Le recto de la pièce d'identité",
  cniVerso: "Le verso de la pièce d'identité",
  permis: 'Le permis de conduire',
}

/** Supprime les fichiers temporaires d'une requête multipart (en cas d'erreur / de refus). */
export function cleanupUploadedFiles(req: Request) {
  const files = req.files as Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined
  if (!files) return
  const list = Array.isArray(files) ? files : Object.values(files).flat()
  for (const f of list) {
    try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path) } catch { /* pas bloquant */ }
  }
}

/**
 * Upload des documents de candidature, avec des erreurs lisibles (400/413 en français)
 * au lieu d'un 500 "File too large" renvoyé par le gestionnaire d'erreurs global.
 */
export function uploadCandidature(req: Request, res: Response, next: NextFunction) {
  candidatureMulter(req, res, (err: unknown) => {
    if (!err) { next(); return }
    cleanupUploadedFiles(req)
    if (err instanceof multer.MulterError) {
      const label = CANDIDATURE_FIELD_LABELS[err.field ?? ''] ?? 'Un des fichiers'
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ message: `Fichier trop lourd : ${label.charAt(0).toLowerCase() + label.slice(1)} dépasse 5 Mo. Réduisez la taille du fichier ou prenez une photo moins lourde.`, field: err.field })
        return
      }
      res.status(400).json({ message: `Fichier refusé : ${err.message}`, field: err.field })
      return
    }
    res.status(400).json({ message: err instanceof Error ? err.message : 'Fichier invalide.' })
  })
}
