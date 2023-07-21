import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import jscookie from 'js-cookie'
import { useRouter } from 'vue-router'
import { checkUser } from '@/api/auth'
import type { IUser } from '@pixels/typings'

export const useAuthStore = defineStore('auth', () => {
  const user = <Ref<IUser | null>>ref()
  const router = useRouter()

  async function checkAuth() {
    const token = jscookie.get('jwt')

    if (!token) {
      user.value = null
      return
    }

    const checkedUser = await checkUser(token)

    if (!checkedUser) {
      user.value = null
      jscookie.remove('jwt')
      return
    }

    user.value = checkedUser
  }

  function logout() {
    user.value = ''
    jscookie.remove('jwt')

    router.push('/')
  }

  return { user, logout, checkAuth }
})
