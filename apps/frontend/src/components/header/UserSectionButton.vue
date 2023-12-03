<template>
  <button class="user-section-button" @click="onClicked">
    {{ text }}
  </button>
</template>

<script lang="ts" setup>
defineProps({
  text: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['clicked'])

function onClicked() {
  emit('clicked')
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.user-section-button {
  background: red;
  border: none;
  border-radius: 5px;
  padding-left: 20px;
  padding-right: 20px;
  color: white;
  background: rgb(0, 132, 168);
  display: inline-block;
  cursor: pointer;
}
</style>
