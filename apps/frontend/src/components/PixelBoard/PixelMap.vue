<script lang="ts" setup>
import { onMounted, type PropType } from 'vue'
import { storeToRefs } from 'pinia'
import { useColorStore } from '@/stores/color'
import { postPixel } from '@/api/pixel'
import type { IBoardDocument } from '@pixels/typings'

const colorStore = useColorStore()

const { selectedColor } = storeToRefs(colorStore)

let canvasElement: HTMLCanvasElement | null = null
let cursorCanvasElement: HTMLCanvasElement | null = null
let cursorContext: CanvasRenderingContext2D | null = null
let ctx: CanvasRenderingContext2D | null = null

const props = defineProps({
  board: {
    type: Object as PropType<IBoardDocument>,
    required: true
  }
})

function initPixelMap() {
  canvasElement = document.getElementById('game') as HTMLCanvasElement

  canvasElement.width = props.board.width
  canvasElement.height = props.board.height

  canvasElement.offscreenCanvas = document.createElement('canvas')
  canvasElement.offscreenCanvas.width = canvasElement.width
  canvasElement.offscreenCanvas.height = canvasElement.height
  ctx = canvasElement.offscreenCanvas.getContext('2d') as CanvasRenderingContext2D

  props.board.pixels.forEach((pixel) => {
    ctx.fillStyle = pixel.color.value
    ctx.fillRect(pixel.col, pixel.row, 1, 1)
  })

  canvasElement.getContext('2d').drawImage(canvasElement.offscreenCanvas, 0, 0)
}

function initCursor() {
  cursorCanvasElement = document.getElementById('cursor') as HTMLCanvasElement
  cursorContext = cursorCanvasElement.getContext('2d') as CanvasRenderingContext2D

  cursorCanvasElement.width = props.board.width
  cursorCanvasElement.height = props.board.height
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width, // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height // relationship bitmap vs. element for y

  return {
    x: Math.trunc((evt.clientX - rect.left) * scaleX), // scale mouse coordinates after they have
    y: Math.trunc((evt.clientY - rect.top) * scaleY) // been adjusted to be relative to element
  }
}

async function clickCanvas(evt: MouseEvent) {
  const pos = getMousePos(cursorCanvasElement, evt)

  await postPixel(selectedColor.value, props.board, pos.x, pos.y)
}

function mouseMove(evt: MouseEvent) {
  if (!cursorCanvasElement && !cursorContext) {
    return
  }

  const pos = getMousePos(cursorCanvasElement, evt)

  cursorContext.clearRect(0, 0, props.board.width, props.board.height)
  cursorContext.fillStyle = 'red'
  cursorContext.fillRect(pos.x, pos.y, 1, 1)
}

function mouseLeave() {
  if (!cursorCanvasElement && !cursorContext) {
    return
  }

  cursorContext.clearRect(0, 0, props.board.width, props.board.height)
}

function initWebSocket() {
  const connection = new WebSocket('ws://localhost:3007')

  connection.onmessage = function (event: MessageEvent) {
    const parsed = JSON.parse(event.data)
    console.log('new message', parsed)

    if (parsed.name === 'new pixel') {
      ctx.fillStyle = parsed.pixel.color.value
      ctx.fillRect(parsed.pixel.col, parsed.pixel.row, 1, 1)
      canvasElement?.getContext('2d').drawImage(canvasElement.offscreenCanvas, 0, 0)
    }

    console.log('new message ?', JSON.parse(event.data))
  }
}

onMounted(() => {
  initWebSocket()
  initPixelMap()
  initCursor()
})
</script>

<template>
  <div class="pixel-map">
    <canvas id="cursor" @mousemove="mouseMove" @mouseleave="mouseLeave" @click="clickCanvas"
      >Cursor</canvas
    >
    <canvas id="game">Pixels</canvas>
    <div id="background"></div>
  </div>
</template>

<style lang="scss" scoped>
.pixel-map {
  display: flex;
  width: 1000px;
  height: 1000px;
  position: relative;
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
