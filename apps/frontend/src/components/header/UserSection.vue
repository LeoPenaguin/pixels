<template>
  <div class="nav-user">
    <template v-if="!user">
      <user-section-button class="nav-user__login" text="Login" @clicked="goToLoginPage" />
      <user-section-button class="nav-user__signup" text="Sign up" @clicked="goToSignupPage" />
    </template>
    <template v-else>
      <div class="nav-user__username">{{ user.username }}</div>
      <user-section-button class="nav-user__logout" text="Logout" @clicked="logout" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import UserSectionButton from './UserSectionButton.vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router/types/routes'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const router = useRouter()

function goToSignupPage() {
  router.push({ name: RouteNames.AUTH_SIGNUP })
}

function goToLoginPage() {
  router.push({ name: RouteNames.AUTH_LOGIN })
}

function logout() {
  authStore.logout()
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.nav-user {
  display: flex;
  flex-direction: row;
  gap: $m1;
  padding: $m1;
  height: 100%;
  justify-content: flex-end;
  align-items: stretch;
  box-sizing: border-box;
  &__username {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $m1;
  }
  &__signup {
    background: rgb(221, 255, 0);
    color: black;
  }
  &__logout {
    background: rgb(255, 0, 0);
    color: white;
  }
}
</style>
