enum SocketEvent {
  ADDPIXEL,
  NEWPIXEL
}

interface PixelData {
  x: number
  y: number
  color: string
}

export interface SocketPayload {
  event: SocketEvent
  data: PixelData
}
