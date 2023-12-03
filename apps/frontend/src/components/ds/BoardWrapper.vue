<template>
  <div ref="container" class="board-wrapper" @wheel="zoom">
    <div
      class="board-wrapper__content"
      :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }"
    >
      <slot name="content" :text="scalePercentage">Empty pixel board content</slot>
    </div>
    <div class="board-wrapper__interface">
      <slot name="interface" :scale-percentage="scalePercentage">Empty pixel board content</slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const container = ref()

const scale = ref(1)

const props = withDefaults(
  defineProps<{
    translateX?: number
    translateY?: number
    maxScale: number
    minScale: number
  }>(),
  {
    translateX: 0,
    translateY: 0
  }
)

const dragging = ref(false)

const emits = defineEmits(['zoom', 'update:translateX', 'update:translateY'])

const scalePercentage = computed(() => {
  return Math.trunc(((scale.value - props.minScale) * 100) / (props.maxScale - props.minScale))
})

const zoom = (event: WheelEvent) => {
  event.preventDefault()
  console.log('zoom')

  if (!dragging.value) {
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    scale.value *= zoomFactor
    if (scale.value > props.maxScale) {
      scale.value = props.maxScale
    } else if (scale.value < props.minScale) {
      scale.value = props.minScale
    }
  }
}

const startDrag = () => {
  dragging.value = true
}

const stopDrag = () => {
  dragging.value = false
}

const drag = (event: MouseEvent) => {
  if (dragging.value) {
    emits('update:translateX', props.translateX + event.movementX / scale.value)
    emits('update:translateY', props.translateY + event.movementY / scale.value)
  }
}

onMounted(() => {
  container.value?.addEventListener('mousedown', startDrag)
  container.value?.addEventListener('mouseup', stopDrag)
  container.value?.addEventListener('mousemove', drag)
})

onUnmounted(() => {
  container.value?.removeEventListener('mousedown', startDrag)
  container.value?.removeEventListener('mouseup', stopDrag)
  container.value?.removeEventListener('mousemove', drag)
})
</script>

<style lang="scss" scropped>
.board-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: absolute;
  overflow: hidden;
  background: black;
  &__content {
    position: absolute;
    transform-origin: center;
    user-select: none;
  }
  &__interface {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    height: fit-content;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
