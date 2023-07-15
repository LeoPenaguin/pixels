<template>
  <div class="nav-dropdown">
    <NavButton :active="isOpen" :text="user.email" :icon="'user'" @click="toggleMenu" />
    <ul v-if="isOpen" class="nav-dropdown__menu">
      <li><EyeIcon /><span>Profile</span></li>
      <li><SettingsIcon /><span>Settings</span></li>
      <li @click="logout"><LogoutIcon /><span>Logout</span></li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import EyeIcon from '@/components/icons/eyeIcon.vue'
import LogoutIcon from '@/components/icons/logoutIcon.vue'
import SettingsIcon from '@/components/icons/settingsIcon.vue'
import NavButton from './NavButton.vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

function logout() {
  authStore.logout()
}

const isOpen = ref(false)

function toggleMenu() {
  isOpen.value = !isOpen.value
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.nav-dropdown {
  position: relative;
  height: 100%;
  &__menu {
    position: absolute;
    top: 45px;
    right: 0;
    margin: 0;
    padding: 5px;
    background: $tertiary-background-color;
    border-radius: 10px;
    list-style: none;
    width: max-content;
    li {
      padding: 0;
      margin: 0;
      padding: 10px 20px 10px 10px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
      &:hover {
        background-color: $background-color;
        cursor: pointer;
      }
    }
  }
}
</style>
