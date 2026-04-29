import { defineStore } from 'pinia'
import api from '../lib/api'
import { getErrorMessage } from '../utils/errorMapper'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    authChecked: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async initAuth() {
      if (this.authChecked) return
      
      this.loading = true
      try {
        // Because of withCredentials: true, the browser will automatically send the HttpOnly cookie
        const { data } = await api.get('/auth/session')
        this.user = data.user
      } catch (err) {
        // 401 means no valid session
        this.user = null
      } finally {
        this.authChecked = true
        this.loading = false
      }
    },

    async signIn(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login', { email, password })
        this.user = data.user
        return true
      } catch (err) {
        if (err.response?.status === 401) {
          this.error = 'Invalid credentials'
        } else {
          this.error = getErrorMessage(err) || 'Failed to sign in'
        }
        return false
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      this.loading = true
      try {
        await api.post('/auth/logout')
        this.user = null
      } catch (err) {
        console.error('Logout error:', err)
      } finally {
        this.loading = false
      }
    },
  },
})
