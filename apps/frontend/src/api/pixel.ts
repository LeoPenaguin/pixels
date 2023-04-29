
function getPixels() {
    return fetch('localhost:3001/api/pixels')
        .then((response) => {
            console.log(response)
        })
}

export { getPixels }
