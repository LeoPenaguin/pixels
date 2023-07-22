import { BASE_URL } from './config'

async function ping() {
  console.log('ping')
  const rawResponse = await fetch(`${BASE_URL}/ping`)
  console.log(rawResponse)

  return rawResponse
}

export { ping }
