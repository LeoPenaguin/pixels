// HTTP calls to the server (chunks are loaded by engine/chunks.ts).

/** Board configuration. palette = colour rows; a colour's index = its position once the rows are flattened. */
export type Config = {
  chunkSize: number
  worldWidth: number // the world is centred on 0, 0
  worldHeight: number
  palette: string[][]
  quota: { burst: number; refillMs: number } // refillMs = 0: unlimited
}

/** A pixel's history; lastChange (Unix ms) is null if its colour never changed. */
export type PixelInfo = { x: number; y: number; c: number; changes: number; lastChange: number | null }

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} : ${String(r.status)}`)
  return r.json() as Promise<T>
}

export const fetchConfig = () => getJSON<Config>('/api/config')

export const fetchPixelInfo = (x: number, y: number) => getJSON<PixelInfo>(`/api/pixels/${String(x)}/${String(y)}`)
