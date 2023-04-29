
async function getBoards() {
    const rawResponse = await fetch('http://localhost:3001/api/boards')
    const response = await rawResponse.json();
    return response
}

async function getBoard(id: string) {
    const request = new Request(`http://localhost:3001/api/board/${id}`)

    const rawResponse = await fetch(request)
    const response = await rawResponse.json();
    return response
}

export { getBoards, getBoard }
