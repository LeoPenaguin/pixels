<template>
  <button
    :class="{'is-active' : active}"
    @click="$emit('click')"
  >
    <IconComponent v-if="icon" />
    <span>{{ text }}</span>
  </button>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

const props = defineProps<{
  active?: Boolean
  text: String
  icon?: 'eye' | 'home' | 'logout' | 'settings' | 'user'
}>()

const IconComponent = defineAsyncComponent(() =>
    import(`../icons/${props.icon}Icon.vue`)
)

defineEmits(['click'])
</script>

<style lang="scss" scoped>
button {
  padding: 0 14px;
  color: white;
  border: 2px solid currentColor;
  background: rgb(26, 26, 26);
  background: none;
  outline: 0;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  height: 40px;
  &.is-active {
    color: rgb(0, 170, 255);
  }
}
</style>
