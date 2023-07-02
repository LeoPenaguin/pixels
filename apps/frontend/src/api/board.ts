import { BASE_URL } from './config'
import type { IBoard } from '@pixels/typings'

async function getBoards(): Promise<IBoard[]> {
  const rawResponse = await fetch(BASE_URL + '/boards')
  return await rawResponse.json()
}

async function getBoard(id: string): Promise<IBoard> {
  const request = new Request(BASE_URL + `/board/${id}`)

  const rawResponse = await fetch(request)
  return await rawResponse.json()
}

export { getBoards, getBoard }
