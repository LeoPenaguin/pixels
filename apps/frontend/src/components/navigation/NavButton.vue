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
@import '@/assets/style/theme.scss';

button {
  padding: $m1 $m2;
  color: $text-color;
  border: pxtorem(2) solid currentColor;
  background: none;
  outline: 0;
  border-radius: $m2;
  display: flex;
  align-items: center;
  gap: $m2;
  cursor: pointer;
  &.is-active {
    color: $active-text-color;
  }
}
</style>
