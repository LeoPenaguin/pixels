import { Board, Pixel } from '../../models'

export async function savePixelToDB(x: number, y: number, color: string) {
  const defaultBoardID = process.env.DEFAULT_BOARD_ID

  const dbBoard = await Board.findById(defaultBoardID)

  if (!dbBoard) {
    console.log('Board not found')
    return
  }

  const newPixel = new Pixel({ col: x, row: y, color })
  await newPixel.save()

  dbBoard.pixels.push(newPixel._id)
  await dbBoard.save()

  return
}
