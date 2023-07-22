import { Router } from 'express'
import { pixel_get, pixel_post } from '../controllers/pixelController'
import { requireAuth } from './middleware/user'

const pixelsRouter = Router()

pixelsRouter.get('/api/pixel/:id', requireAuth, pixel_get)
pixelsRouter.post('/api/pixel', requireAuth, pixel_post)

export default pixelsRouter
