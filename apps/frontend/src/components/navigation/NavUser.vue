<template>
  <div class="nav-user">
    <template v-if="!user">
      <RouterLink to="/auth/signup">Sign up</RouterLink>
      <RouterLink to="/auth/login">Login</RouterLink>
    </template>
    <template v-else>
      {{ user.email }}
      <button @click="logout"><LogoutIcon /><span>Logout</span></button>
    </template>
  </div>
</template>

<script lang="ts" setup>
import LogoutIcon from '@/components/icons/LogoutIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

function logout() {
  authStore.logout()
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
