import { Router } from 'express'
import {
  createCandidature,
  listCandidatures,
  getCandidature,
  updateCandidature,
  deleteCandidature,
  exportCandidaturesCsv,
  serveUpload,
  sendCandidatureAffiche,
} from '../controllers/candidature.controller'
import { authMiddleware, optionalAuthMiddleware, requirePermission, requirePermissionIfAuthed } from '../middlewares/auth.middleware'
import { uploadCandidature } from '../middlewares/upload.middleware'

const router = Router()

router.post('/', uploadCandidature, optionalAuthMiddleware, requirePermissionIfAuthed('candidatures', 'edit'), createCandidature)

router.use(authMiddleware)
router.get('/export/csv', requirePermission('candidatures', 'read'), exportCandidaturesCsv)
router.get('/', requirePermission('candidatures', 'read'), listCandidatures)
router.get('/:id', requirePermission('candidatures', 'read'), getCandidature)
router.patch('/:id', requirePermission('candidatures', 'edit'), updateCandidature)
router.delete('/:id', requirePermission('candidatures', 'edit'), deleteCandidature)
router.post('/:id/affiche', requirePermission('candidatures', 'edit'), sendCandidatureAffiche)

router.get('/uploads/:folder/:filename', requirePermission('candidatures', 'read'), serveUpload)

export default router
