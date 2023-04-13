<script lang='ts' setup>
import { onMounted, onUnmounted, ref } from 'vue';

const container = ref()
const slot = ref()

const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);

let dragging = false;

const zoom = (event: WheelEvent) => {
  if (!dragging) {
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    scale.value *= zoomFactor;
  }
};

const startDrag = () => {
  dragging = true;
};

const stopDrag = () => {
  dragging = false;
};

const drag = (event: MouseEvent) => {
  if (dragging) {
    translateX.value = translateX.value + event.movementX / scale.value;
    translateY.value = translateY.value + event.movementY / scale.value;
  }
};

onMounted(() => {
  container.value.addEventListener('mousedown', startDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mousemove', drag);
});

onUnmounted(() => {
  container.value.removeEventListener('mousedown', startDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('mousemove', drag);
});
</script>

<template>
  <div
    ref="container"
    class="board-content"
    @wheel="zoom"
  >
    <div
      ref="slot"
      class="board-content__slot"
      :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }"
    >
      <slot>Empty pixel board content</slot>
    </div>
  </div>
</template>

<style lang="scss" scropped>
.board-content {
  border: 4px solid rgb(128, 255, 0);
  height: 100%;
  box-sizing: border-box;
  position: relative;
  &__slot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center;
    outline: 4px solid red;
  }
}
</style>
