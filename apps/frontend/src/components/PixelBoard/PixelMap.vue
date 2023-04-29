<script lang="ts" setup>
import { onMounted } from 'vue';
import pixelsPng from '@/assets/pixels.png'

onMounted(() => {
    const ctx = document.getElementById("game").getContext("2d");

    const image = new Image();
    image.onload = () => {
        ctx.drawImage(image, 0, 0);
    };
    image.src = pixelsPng;
})

</script>

<template>
  <div class="pixel-map">
    <canvas
      id="game"
      width="1000"
      height="1000"
    >Pixels</canvas>
  </div>
</template>

<style lang="scss" scoped>
canvas {
  height: 600px;
  aspect-ratio: 1;
  image-rendering: pixelated;
}
</style>
