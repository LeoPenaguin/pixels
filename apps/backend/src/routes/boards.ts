import { Router } from 'express'
import * as boardController from '../controllers/boardController'

const boardsRouter = Router()

boardsRouter.get('/api/boards', boardController.board_get)
boardsRouter.get('/api/board/:id', boardController.oneBoard_get)
boardsRouter.post('/api/board', boardController.board_post)

export default boardsRouter
