import { BASE_URL } from './config'

function getColors() {
  return fetch(BASE_URL + '/colors').then((response) => {
    console.log(response)
  })
}

export { getColors }
