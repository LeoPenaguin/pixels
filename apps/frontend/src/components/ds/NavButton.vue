<template>
  <button @click="onClicked">
    <span v-if="text">{{ text }}</span>
  </button>
</template>

<script lang="ts" setup>
interface Props {
  text?: string
  outlined?: boolean
  type?: 'primary' | 'success' | 'warning' | 'danger'
}

withDefaults(defineProps<Props>(), {
  text: undefined,
  outlined: false,
  type: 'primary',
  icon: undefined
})

const emit = defineEmits(['click'])

function onClicked(e: Event) {
  e.preventDefault()
  emit('click')
}
</script>

<style lang="scss" scoped>
button {
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  color: white;
  display: inline-block;
  cursor: pointer;
  font-size: 15px;
  border-radius: var(--border-radius-1);
  font-weight: 500;
  background: #46a085;

  &:hover {
    background: #39826c;
  }
}
</style>
