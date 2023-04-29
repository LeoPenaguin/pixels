import express, {Request, Response} from 'express'
import { Board } from '../models/board';

var boardsRouter = express.Router();

boardsRouter.get('/api/boards', async (req:Request, res:Response) => {
    const boards = await Board.find({})
    res.json(boards)
})

boardsRouter.get('/api/board/:id', async (req:Request, res:Response) => {
    const board = await Board.findById(req.params.id)
    res.json(board)
})

boardsRouter.post('/api/board', async (req:Request, res:Response) => {
    const {name} = req.body

    const board = new Board({name})
    await board.save()

    res.status(201).json(board)
})

export default boardsRouter;