import { BASE_URL } from './config'
import type { IPixel } from '@pixels/typings'

async function postPixel(color, board, col, row) {
  const payload = {
    colorId: color._id,
    col,
    row,
    boardId: board._id
  }

  const rawResponse = await fetch(BASE_URL + '/pixel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  return await rawResponse.json()
}

export { postPixel }
