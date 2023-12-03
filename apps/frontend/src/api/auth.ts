import { BASE_URL } from './config'

async function login(email: string, password: string) {
  const response = await fetch(BASE_URL + '/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' }
  })
  return await response.json()
}

async function register(email: string, password: string, username: string) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
    headers: { 'Content-Type': 'application/json' }
  })
  return await res.json()
}

async function checkUser(token: string) {
  const checkUser = await fetch(`${BASE_URL}/checkuser?token=${token}`)
  return await checkUser.json()
}

export { login, register, checkUser }
