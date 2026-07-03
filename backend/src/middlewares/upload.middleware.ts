import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

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

const cvFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.pdf', '.doc', '.docx']
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('Le CV doit être un fichier PDF, DOC ou DOCX.'))
}

const photoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true)
  else cb(new Error('La photo doit être un fichier JPG, PNG ou WEBP.'))
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

export const uploadCandidature = multer({
  storage: tmpStorage,
  limits: { fileSize: Math.max(MAX_CV_SIZE, MAX_CNI_SIZE) },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cv') cvFilter(req, file, cb)
    else if (file.fieldname === 'photo') photoFilter(req, file, cb)
    else if (file.fieldname === 'cniRecto' || file.fieldname === 'cniVerso') cniFilter(req, file, cb)
    else cb(null, false)
  },
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'cniRecto', maxCount: 1 },
  { name: 'cniVerso', maxCount: 1 },
])
