<template>
  <div class="board-overlay">
    <div class="left"></div>
    <div class="middle">
      <ColorPicker />
    </div>
    <div class="right">
      <ToggleSidebar />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import ColorPicker from '@/components/board/overlay/ColorPicker.vue'
import ToggleSidebar from '@/components/board/overlay/ToggleSidebar.vue'

const colorStore = useColorStore()

const { colors, selectedColor } = storeToRefs(colorStore)

onMounted(() => {
  if (!selectedColor.value) {
    selectedColor.value = colors.value[0]
  }
})
</script>

<style lang="scss" scropped>
.board-overlay {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  gap: var(--space0);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;

  .left,
  .middle,
  .right {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex: 1;
    gap: var(--space0);
  }

  .middle {
    flex: 2;
  }

  .right {
    justify-content: flex-end;
  }
}
</style>
