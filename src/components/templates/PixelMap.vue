<script lang="ts" setup>
import { onMounted } from 'vue';
import catPng from '@/assets/cat.png'

onMounted(() => {
    const ctx = document.getElementById("game").getContext("2d");

    const image = new Image();
    image.onload = () => {
        ctx.drawImage(image, 0, 0);
    };
    image.src = catPng;
})

</script>

<template>
  <div class="pixel-map">
    <canvas
      id="game"
      width="128"
      height="128"
    >Pixels</canvas>
  </div>
</template>

<style lang="scss" scoped>
canvas {
  width: 512px;
  height: 512px;
  image-rendering: pixelated;
}
</style>
