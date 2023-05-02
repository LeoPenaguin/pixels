import { BASE_URL } from './config'

async function getBoards() {
  const rawResponse = await fetch(BASE_URL + '/boards')
  const response = await rawResponse.json()
  return response
}

async function getBoard(id: string) {
  const request = new Request(BASE_URL + `/board/${id}`)

  const rawResponse = await fetch(request)
  const response = await rawResponse.json()
  return response
}

export { getBoards, getBoard }
