import { ref } from 'vue'
import { defineStore } from 'pinia'

let ws: WebSocket | null = null

export const useWebsocketStore = defineStore('websocket', () => {
  if (!ws) {
    ws = new WebSocket('ws://localhost:3007')
  }

  const data = ref<string>('')
  const status = ref<'OPEN' | 'CLOSED'>('CLOSED')

  ws.onopen = () => {
    status.value = 'OPEN'
  }

  ws.onclose = () => {
    status.value = 'CLOSED'
  }

  ws.onmessage = (event: MessageEvent) => {
    data.value = event.data
  }

  function send(message: string) {
    ws?.send(message)
  }

  return {
    data,
    status,
    send
  }
})
