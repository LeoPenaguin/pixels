<script lang="ts" setup>
import { ref } from 'vue';
import EyeIcon from '../icons/eyeIcon.vue';
import LogoutIcon from '../icons/logoutIcon.vue';
import SettingsIcon from '../icons/settingsIcon.vue';
import NavButton from './NavButton.vue';

const isOpen = ref(false)

function toggleMenu() {
    isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="nav-dropdown">
    <div class="nav-dropdown__top">
      <NavButton
        :active="isOpen"
        text="Leo PNG"
        :icon="'user'"
        @click="toggleMenu"
      />
    </div>
    <ul
      v-if="isOpen"
      class="nav-dropdown__menu"
    >
      <li><EyeIcon /><span>Profile</span></li>
      <li><SettingsIcon /><span>Settings</span></li>
      <li><LogoutIcon /><span>Logout</span></li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.nav-dropdown {
  position: relative;
  &__top {
    display: block;
  }
  &__menu {
    position: absolute;
    background: red;
    top: 45px;
    right: 0;
    height: fit-content;
    margin: 0;
    padding: 5px;
    background: rgb(52, 52, 52);
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
        background-color: rgb(41, 41, 41);
        cursor: pointer;
      }
    }
  }
}
</style>
