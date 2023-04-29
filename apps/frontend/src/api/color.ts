function getColors() {
  return fetch('localhost:3000/api/colors').then((response) => {
    console.log(response)
  })
}

export { getColors }
