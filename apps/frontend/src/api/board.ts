import { BASE_URL, getAuthHeader } from './config'
import type { IBoard } from '@pixels/typings'

async function getBoards(): Promise<IBoard[]> {
  const rawResponse = await fetch(`${BASE_URL}/boards`)
  return await rawResponse.json()
}

async function getBoard(id: string): Promise<IBoard> {
  const headers = getAuthHeader()
  const rawResponse = await fetch(`${BASE_URL}/board/${id}`, { headers })
  return await rawResponse.json()
}

export { getBoard }
