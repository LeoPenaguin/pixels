import { Router } from 'express'
import { pixel_get, pixel_post } from '../controllers/pixelController'

const pixelsRouter = Router()

pixelsRouter.get('/api/pixel/:id', pixel_get)
pixelsRouter.post('/api/pixel', pixel_post)

export default pixelsRouter
