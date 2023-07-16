import { colors_get } from '../controllers/colorController'
import { Router } from 'express'

const colorsRouter = Router()

colorsRouter.get('/api/colors', colors_get)

export default colorsRouter
