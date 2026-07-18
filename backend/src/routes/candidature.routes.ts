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
import { authMiddleware } from '../middlewares/auth.middleware'
import { uploadCandidature } from '../middlewares/upload.middleware'

const router = Router()

router.post('/', uploadCandidature, createCandidature)

router.use(authMiddleware)
router.get('/export/csv', exportCandidaturesCsv)
router.get('/', listCandidatures)
router.get('/:id', getCandidature)
router.patch('/:id', updateCandidature)
router.delete('/:id', deleteCandidature)
router.post('/:id/affiche', sendCandidatureAffiche)

router.get('/uploads/:folder/:filename', serveUpload)

export default router
