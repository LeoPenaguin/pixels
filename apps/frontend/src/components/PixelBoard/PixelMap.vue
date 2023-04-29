<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useBoardStore } from '@/stores/board';
import { storeToRefs } from 'pinia';

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
let canvasElement:HTMLCanvasElement | null = null
let ctx:CanvasRenderingContext2D | null = null
const colors = ['#571746', '#90113F', '#C71E39', '#FD5734', '#FEC302']

function getRandomColor() {
    const min = Math.ceil(0);
    const max = Math.floor(colors.length);
    return colors[Math.floor(Math.random() * (max - min) + min)]; // The maximum is exclusive and the minimum is inclusive
}

onMounted(() => {
    canvasElement = document.getElementById("game") as HTMLCanvasElement
    ctx = canvasElement.getContext("2d") as CanvasRenderingContext2D;

    console.log(board.value?.width, board.value?.height)

    canvasElement.width = board.value?.width
    canvasElement.height = board.value?.height

    for (let col = 0; col < board.value?.width; col++) {
        for (let row = 0; row < board.value?.height; row++) {
            ctx.fillStyle = getRandomColor();
            ctx.fillRect(col, row, 1, 1);
        }
    }
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
