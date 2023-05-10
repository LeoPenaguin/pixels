import { BASE_URL } from './config'

async function getColors() {
  const rawResponse = await fetch(BASE_URL + '/colors')
  const response = await rawResponse.json()
  return response
}

export { getColors }
