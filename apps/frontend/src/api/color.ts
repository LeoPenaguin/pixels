import { BASE_URL, getAuthHeader } from './config'
import type { IColor } from '@pixels/typings'

async function getColors(): Promise<IColor[]> {
  const headers = getAuthHeader()
  const rawResponse = await fetch(`${BASE_URL}/colors`, { headers })
  return await rawResponse.json()
}

export { getColors }
