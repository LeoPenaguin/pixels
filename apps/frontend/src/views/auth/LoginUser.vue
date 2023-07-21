<template>
  <div class="form-wraper">
    <form>
      <h1>Login</h1>
      <div class="input-group">
        <label for="email">Email</label>
        <input v-model="emailValue" type="text" name="email" />
        <div class="error">{{ emailError }}</div>
      </div>
      <div class="input-group">
        <label for="password">Password</label>
        <input v-model="passwordValue" type="password" name="password" />
        <div class="error">{{ passwordError }}</div>
      </div>
      <button @click="submit">Login</button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import jscookie from 'js-cookie'
import { login } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

const { user } = storeToRefs(authStore)

const emailValue = ref('')
const passwordValue = ref('')
const emailError = ref('')
const passwordError = ref('')

async function submit(e: MouseEvent) {
  e.preventDefault()

  // reset errors
  emailError.value = ''
  passwordError.value = ''

  try {
    const data = await login(emailValue.value, passwordValue.value)
    if (data.errors) {
      emailError.value = data.errors.email
      passwordError.value = data.errors.password
    }
    if (data.user) {
      user.value = data.user
      jscookie.set('jwt', data.token, {
        expires: 3
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
        border-radius: 0.3rem;
      }
      .error {
        color: red;
        margin-top: 0.1rem;
      }
    }
    button {
      font-size: 1.1rem;
      padding: 0.5rem 1rem;
      border-radius: 0.3rem;
      border: 0;
      background: rgb(0, 152, 198);
      color: white;
    }
  }
}
</style>
