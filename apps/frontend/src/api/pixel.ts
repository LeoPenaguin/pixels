
function getPixels() {
    return fetch('localhost:3000/api/pixels')
        .then((response) => {
            console.log(response)
        })
}

export { getPixels }
