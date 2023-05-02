import { BASE_URL } from './config'

function getPixels() {
  return fetch(BASE_URL + '/pixels').then((response) => {
    console.log(response)
  })
}

export { getPixels }
