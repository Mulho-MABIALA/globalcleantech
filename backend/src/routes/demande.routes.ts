import { Router } from 'express'
import {
  createDemande,
  listDemandes,
  getDemande,
  updateDemande,
  deleteDemande,
  exportDemandesCsv,
} from '../controllers/demande.controller'
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', createDemande)

router.use(authMiddleware)
router.get('/export/csv', requirePermission('demandes', 'read'), exportDemandesCsv)
router.get('/', requirePermission('demandes', 'read'), listDemandes)
router.get('/:id', requirePermission('demandes', 'read'), getDemande)
router.patch('/:id', requirePermission('demandes', 'edit'), updateDemande)
router.delete('/:id', requirePermission('demandes', 'edit'), deleteDemande)

export default router
