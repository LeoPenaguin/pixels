import { BASE_URL } from './config'
import type { IColor } from '@pixels/typings'

async function getColors(): Promise<IColor[]> {
  const rawResponse = await fetch(BASE_URL + '/colors')
  return await rawResponse.json()
}

export { getColors }
