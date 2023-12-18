import { BASE_URL, getAuthHeader } from './config'
import type { IBoard } from '@pixels/typings'

async function getBoard(id: string): Promise<IBoard> {
  const headers = getAuthHeader()
  const rawResponse = await fetch(`${BASE_URL}/board/${id}`, { headers })
  return await rawResponse.json()
}

async function getDefaultBoard(): Promise<IBoard> {
  return await getBoard('6457f22f4c33d368b52d79c1')
}

export { getDefaultBoard }
