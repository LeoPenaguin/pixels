import { BASE_URL } from './config'

async function getPixels() {
  const rawResponse = await fetch(BASE_URL + '/pixels')
  const response = await rawResponse.json()
  return response
}

export { getPixels }
