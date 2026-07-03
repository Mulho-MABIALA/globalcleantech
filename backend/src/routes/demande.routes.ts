import { Router } from 'express'
import {
  createDemande,
  listDemandes,
  getDemande,
  updateDemande,
  deleteDemande,
  exportDemandesCsv,
} from '../controllers/demande.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', createDemande)

router.use(authMiddleware)
router.get('/export/csv', exportDemandesCsv)
router.get('/', listDemandes)
router.get('/:id', getDemande)
router.patch('/:id', updateDemande)
router.delete('/:id', deleteDemande)

export default router
