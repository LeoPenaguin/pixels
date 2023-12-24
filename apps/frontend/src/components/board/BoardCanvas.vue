<template>
  <div class="board-canvas">
    <div ref="mouseCursor" class="mouse-cursor"></div>
    <MouseCursor />

    <canvas id="cursor" @mousemove="mouseMove" @mouseleave="mouseLeave" @click="clickCanvas"
      >Cursor</canvas
    >
    <canvas id="game">Pixels</canvas>
    <div id="background"></div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorStore } from '@/stores/color'
import { useCursorStore } from '@/stores/cursor'
import { useBoardStore } from '@/stores/board'
import { useWebsocketStore } from '@/stores/websocket'
import MouseCursor from '@/components/board/overlay/MouseCursor.vue'

const colorStore = useColorStore()
const cursorStore = useCursorStore()
const boardStore = useBoardStore()
const websocketStore = useWebsocketStore()

const { data } = storeToRefs(websocketStore)
const { board } = storeToRefs(boardStore)
const { selectedColor } = storeToRefs(colorStore)
const { cursorPosition } = storeToRefs(cursorStore)

let canvasElement: HTMLCanvasElement | null = null
let cursorCanvasElement: HTMLCanvasElement | null = null
let cursorContext: CanvasRenderingContext2D | null = null
let ctx: CanvasRenderingContext2D | null = null

const mouseCursor = ref<HTMLDivElement>()

function initPixelMap() {
  canvasElement = document.getElementById('game') as HTMLCanvasElement

  if (!canvasElement) {
    return
  }

  canvasElement.width = board.value.width
  canvasElement.height = board.value.height

  canvasElement.offscreenCanvas = document.createElement('canvas')
  canvasElement.offscreenCanvas.width = canvasElement.width
  canvasElement.offscreenCanvas.height = canvasElement.height
  ctx = canvasElement.offscreenCanvas.getContext('2d') as CanvasRenderingContext2D

  board.value.pixels.forEach((pixel) => {
    ctx.fillStyle = pixel.color
    ctx.fillRect(pixel.x, pixel.y, 1, 1)
  })

  canvasElement.getContext('2d').drawImage(canvasElement.offscreenCanvas, 0, 0)
}

function initCursor() {
  cursorCanvasElement = document.getElementById('cursor') as HTMLCanvasElement
  cursorContext = cursorCanvasElement.getContext('2d') as CanvasRenderingContext2D

  cursorCanvasElement.width = board.value.width
  cursorCanvasElement.height = board.value.height
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): void {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width, // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height // relationship bitmap vs. element for y

  cursorPosition.value = {
    x: Math.trunc((evt.clientX - rect.left) * scaleX), // scale mouse coordinates after they have
    y: Math.trunc((evt.clientY - rect.top) * scaleY) // been adjusted to be relative to element
  }
}

async function clickCanvas(evt: MouseEvent) {
  getMousePos(cursorCanvasElement, evt)

  if (!cursorPosition.value) {
    return
  }

  paintPixel()
}

const paintPixel = async () => {
  websocketStore.send(
    JSON.stringify({
      event: 0,
      data: {
        color: selectedColor.value,
        x: cursorPosition.value.x,
        y: cursorPosition.value.y
      }
    })
  )
}

function mouseMove(evt: MouseEvent) {
  if (!cursorCanvasElement || !cursorContext) {
    return
  }

  getMousePos(cursorCanvasElement, evt)

  cursorContext.clearRect(0, 0, board.value.width, board.value.height)
  cursorContext.fillStyle = 'red'
  cursorContext.fillRect(cursorPosition.value.x, cursorPosition.value.y, 1, 1)
}

function mouseLeave() {
  if (!cursorCanvasElement || !cursorContext) {
    return
  }

  cursorContext.clearRect(0, 0, board.value.width, board.value.height)
}

watch(data, (newData) => {
  const parsed = JSON.parse(newData as string)

  if (parsed.event === 0) {
    ctx.fillStyle = parsed.data.color
    ctx.fillRect(parsed.data.x, parsed.data.y, 1, 1)
    canvasElement?.getContext('2d').drawImage(canvasElement.offscreenCanvas, 0, 0)
  }
})

onMounted(() => {
  initPixelMap()
  initCursor()
})
</script>

<style lang="scss" scoped>
.board-canvas {
  display: flex;
  height: 500px;
  aspect-ratio: 1;
  position: relative;
  cursor: none;
  canvas {
    aspect-ratio: 1;
    image-rendering: pixelated;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  #background {
    z-index: 1;
    background: white;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  #game {
    z-index: 2;
  }
  #cursor {
    z-index: 3;
  }
}
</style>
