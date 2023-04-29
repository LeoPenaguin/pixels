<script lang="ts" setup>
import { onMounted } from 'vue';
import pixelsPng from '@/assets/pixels.png'
import { useBoardStore } from '@/stores/board';
import { storeToRefs } from 'pinia';

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)

onMounted(() => {
    const canvasElement = document.getElementById("game") as HTMLCanvasElement
    const ctx = canvasElement.getContext("2d") as CanvasRenderingContext2D;

    console.log(board.value?.width, board.value?.height)

    canvasElement.width = board.value?.width
    canvasElement.height = board.value?.height

    const image = new Image();
    image.onload = () => {
        ctx.drawImage(image, 0, 0);
    };
    image.src = pixelsPng;
})

</script>

<template>
  <div
    class="pixel-map"
  >
    <canvas
      id="game"
    >Pixels</canvas>
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
