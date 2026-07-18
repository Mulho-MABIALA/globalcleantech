import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'

import authRoutes from './routes/auth.routes'
import candidatureRoutes from './routes/candidature.routes'
import demandeRoutes from './routes/demande.routes'
import dashboardRoutes from './routes/dashboard.routes'
import publicRoutes from './routes/public.routes'
import messageRoutes from './routes/message.routes'
import temoignageRoutes from './routes/temoignage.routes'
import userRoutes from './routes/user.routes'
import placementRoutes from './routes/placement.routes'
import searchRoutes from './routes/search.routes'
import notificationRoutes from './routes/notification.routes'
import { authMiddleware } from './middlewares/auth.middleware'
import { startCronJobs } from './cron/reminders'

const app = express()
const PORT = process.env.PORT || 3001
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

// Normalisation : espaces et slash final tolérés dans FRONTEND_URL
const normalizeOrigin = (o: string) => o.trim().replace(/\/+$/, '')

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://globalcleantechsn.com',
  'https://www.globalcleantechsn.com',
].map(normalizeOrigin)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(normalizeOrigin(origin))) callback(null, true)
    else callback(new Error(`CORS bloqué pour l'origine : ${origin}`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/public', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/candidatures', candidatureRoutes)
app.use('/api/demandes', demandeRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/temoignages', temoignageRoutes)
app.use('/api/users', userRoutes)
app.use('/api/placements', placementRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)

// Wildcard : les fichiers peuvent être dans des sous-dossiers (ex: candidatures/4/xxx.pdf)
app.get('/api/uploads/*', authMiddleware, (req: Request, res: Response) => {
  const rel = (req.params as Record<string, string>)[0] ?? ''
  const uploadRoot = path.resolve(UPLOAD_DIR)
  const filePath = path.resolve(uploadRoot, rel)
  if (!filePath.startsWith(uploadRoot + path.sep)) { res.status(403).json({ message: 'Accès refusé.' }); return }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) { res.status(404).json({ message: 'Fichier introuvable.' }); return }
  res.sendFile(filePath)
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Frontend statique (déploiement "même conteneur" : Docker/VPS) ─────────────
// N'a aucun effet sur le déploiement Render/Netlify existant : le dossier
// n'existe simplement pas dans ce cas, donc ce bloc est ignoré.
const PUBLIC_DIR = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../public')
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR))
  // Fallback SPA : toute route non-API renvoie index.html (React Router prend le relais)
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) { next(); return }
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
  })
  console.log(`🖥️  Frontend servi depuis ${PUBLIC_DIR}`)
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Erreur serveur interne.' })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur Global Clean Tech démarré sur http://localhost:${PORT}`)
  startCronJobs()
})

export default app
