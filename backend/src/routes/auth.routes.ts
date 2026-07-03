import { Router } from 'express'
import { login, me, logout, updateProfile, changePassword, updateAvatar, deleteAvatar } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { uploadAvatar } from '../middlewares/upload.middleware'

const router = Router()

router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.get('/me', authMiddleware, me)
router.patch('/me', authMiddleware, updateProfile)
router.patch('/me/password', authMiddleware, changePassword)
router.post('/me/avatar', authMiddleware, uploadAvatar, updateAvatar)
router.delete('/me/avatar', authMiddleware, deleteAvatar)

export default router
