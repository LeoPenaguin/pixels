import { Router } from 'express'
import * as authController from '../controllers/authController'

const router = Router()

router.post('/api/signup', authController.signup_post)
router.post('/api/login', authController.login_post)
router.get('/api/logout', authController.logout_get)
router.get('/api/checkuser', authController.checkuser_get)

export default router
