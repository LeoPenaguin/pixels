import { BASE_URL, getAuthHeader } from './config'
import type { IColor, IBoard } from '@pixels/typings'

async function postPixel(color: IColor, board: IBoard, col: number, row: number) {
  const headers = getAuthHeader()
  const payload = {
    colorId: color._id,
    col,
    row,
    boardId: board._id
  }

  const rawResponse = await fetch(`${BASE_URL}/pixel`, {
    headers,
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return await rawResponse.json()
}

export { postPixel }
