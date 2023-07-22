import jscookie from 'js-cookie'

const PORT = 3007
const BASE_URL = `http://localhost:${PORT}/api`

function getAuthHeader(): Headers {
  return new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jscookie.get('jwt')}`
  })
}

export { BASE_URL, getAuthHeader }
