enum SocketEvent {
  ADDPIXEL,
  NEWPIXEL
}

interface PixelData {
  x: number
  y: number
  colorId: string
}

export interface SocketPayload {
  event: SocketEvent
  data: PixelData
}
