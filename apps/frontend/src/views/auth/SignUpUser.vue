<template>
  <div class="form-wraper">
    <form>
      <h1>Sign up</h1>
      <div class="input-group">
        <label for="email">Email</label>
        <input v-model="emailValue" autocomplete="email" type="text" name="email" />
        <div class="error">{{ emailError }}</div>
      </div>
      <div class="input-group">
        <label for="password">Password</label>
        <input
          v-model="passwordValue"
          autocomplete="new-password"
          type="password"
          name="password"
        />
        <div class="error">{{ passwordError }}</div>
      </div>
      <div class="input-group">
        <label for="username">User name</label>
        <input v-model="usernameValue" autocomplete="new-username" type="string" name="username" />
        <div class="error">{{ usernameError }}</div>
      </div>
      <AtomButton text="Sign up" @click="submit"></AtomButton>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import jscookie from 'js-cookie'
import { register } from '@/api/auth'
import AtomButton from '@/components/ds/AtomButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const { user } = storeToRefs(authStore)

const emailValue = ref('')
const passwordValue = ref('')
const usernameValue = ref('')

const emailError = ref('')
const passwordError = ref('')
const usernameError = ref('')

async function submit(e: MouseEvent) {
  e.preventDefault()

  // reset errors
  emailError.value = ''
  passwordError.value = ''
  usernameError.value = ''

  const maxAge = 3 * 24 * 60 * 60

  try {
    const data = await register(emailValue.value, passwordValue.value, usernameValue.value)

    if (data.errors) {
      emailError.value = data.errors.email
      passwordError.value = data.errors.password
      usernameError.value = data.errors.username
    }
    if (data.user) {
      user.value = data.user
      jscookie.set('jwt', data.token, {
        expires: maxAge * 1000
      })
      router.push('/')
    }
  } catch (err) {
    console.log(err)
  }
}
</script>

<style lang="scss" scoped>
.form-wraper {
  width: 100vw;
  display: flex;
  justify-content: center;
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 500px;
    .input-group {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      width: 100%;
      label {
        font-size: 1.1rem;
        margin-bottom: 0.1rem;
      }
      input {
        font-size: 1.1rem;
        padding: 0.5rem;
        border-radius: var(--border-radius-1);
      }
      .error {
        color: var(--error-color);
        margin-top: 0.1rem;
      }
    }
  }
}
</style>
