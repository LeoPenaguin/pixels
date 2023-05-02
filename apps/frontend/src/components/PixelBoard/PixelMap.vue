<script lang="ts" setup>
import { onMounted } from 'vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { useColorStore } from '@/stores/color'

const colorStore = useColorStore()

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
const { colors } = storeToRefs(colorStore)

let canvasElement: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function getRandomColor() {
  const min = Math.ceil(0)
  const max = Math.floor(colors.value.length)
  const color = colors.value[Math.floor(Math.random() * (max - min) + min)]
  console.log(color)
  return color.value
}

onMounted(() => {
  canvasElement = document.getElementById('game') as HTMLCanvasElement

  canvasElement.width = board.value?.width
  canvasElement.height = board.value?.height

  canvasElement.offscreenCanvas = document.createElement('canvas')
  canvasElement.offscreenCanvas.width = canvasElement.width
  canvasElement.offscreenCanvas.height = canvasElement.height
  ctx = canvasElement.offscreenCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D

  for (let col = 0; col < board.value?.width; col++) {
    for (let row = 0; row < board.value?.height; row++) {
      ctx.fillStyle = getRandomColor()
      ctx.fillRect(col, row, 1, 1)
    }
  }

  canvasElement.getContext('2d').drawImage(canvasElement.offscreenCanvas, 0, 0)
})
</script>

<template>
  <div class="pixel-map">
    <canvas id="game">Pixels</canvas>
  </div>
</template>

<style lang="scss" scoped>
.pixel-map {
  background: red;
  display: flex;
  outline: 15px 15px red;
  width: 1000px;
  height: 1000px;
  canvas {
    aspect-ratio: 1;
    image-rendering: pixelated;
  }
}
</style>
