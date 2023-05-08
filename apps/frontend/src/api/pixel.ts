import { BASE_URL } from './config'

async function postPixel(color, board, col, row) {
  const payload = {
    color: color.value,
    col,
    row,
    board: board.value
  }

  console.log('payload', payload)

  const rawResponse = await fetch(BASE_URL + '/pixel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const response = await rawResponse.json()
  return response
}

export { postPixel }
