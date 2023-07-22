import { colors_get } from '../controllers/colorController'
import { Router } from 'express'
import { requireAuth } from './middleware/user'

const colorsRouter = Router()

colorsRouter.get('/api/colors', requireAuth, colors_get)

export default colorsRouter
