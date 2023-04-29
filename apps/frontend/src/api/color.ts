
function getColors() {
    return fetch('localhost:3001/api/colors')
        .then((response) => {
            console.log(response)
        })
}

export { getColors }
