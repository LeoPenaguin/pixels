<template>
  <button :class="[{ outlined }, type, { icon: !!icon }]" @click="onClicked">
    <span v-if="icon">
      <CheckIcon v-if="icon === 'check'" />
      <CloseIcon v-if="icon === 'close'" />
      <LogoutIcon v-if="icon === 'logout'" />
    </span>
    <span v-if="text">{{ text }}</span>
  </button>
</template>

<script lang="ts" setup>
import CloseIcon from '@/components/icons/CloseIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import LogoutIcon from '@/components/icons/LogoutIcon.vue'

interface Props {
  text?: string
  outlined?: boolean
  type?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: 'check' | 'close' | 'logout'
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
  background: var(--accent-color);
  border: none;
  border-radius: 5px;
  padding: var(--space0) var(--space1);
  color: var(--background-color);
  display: inline-block;
  cursor: pointer;
  font-size: 16px;
  border-radius: var(--border-radius-1);
  border: 2px solid var(--accent-color);
  font-weight: 500;
  &.icon {
    padding: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      display: block;
      width: 24px;
      height: 24px;
      svg {
        width: 24px;
        height: 24px;
        color: var(--background-color);
      }
    }
    &.outlined {
      svg {
        color: var(--accent-color);
      }
    }
  }
  &.success {
    background: var(--success-color);
    border-color: var(--success-color);
    color: var(--success-color);
  }
  &.warning {
    background: var(--warning-color);
    border-color: var(--warning-color);
    color: var(--warning-color);
  }
  &.danger {
    background: var(--danger-color);
    border-color: var(--danger-color);
    color: var(--danger-color);
  }
  &:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--background-color);
  }
  &.outlined {
    background: transparent;
    color: var(--accent-color);
    &.success {
      color: var(--success-color);
    }
    &.warning {
      color: var(--warning-color);
    }
    &.danger {
      color: var(--danger-color);
    }
    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>
