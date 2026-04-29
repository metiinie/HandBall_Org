<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = t('auth.login_err_missing')
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.signIn(email.value.trim(), password.value)
    const redirect = route.query.redirect || '/admin'
    await router.push(redirect)
  } catch (e) {
    error.value = t('auth.login_err_invalid')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style="background-color: var(--bg-app);">

    <div class="w-full max-w-sm animate-slide-up">

      <!-- Logo + Title -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 mb-5">
          <svg viewBox="0 0 64 64" class="w-8 h-8" fill="none" stroke="white" stroke-width="2.5">
            <circle cx="32" cy="32" r="20"/>
            <path d="M32 12 Q40 22 40 32 Q40 42 32 52"/>
            <path d="M32 12 Q24 22 24 32 Q24 42 32 52"/>
            <line x1="12" y1="32" x2="52" y2="32"/>
          </svg>
        </div>
        <h1 class="text-2xl font-black tracking-tight" style="color: var(--text-heading);">{{ t('auth.admin_portal') }}</h1>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] mt-2" style="color: var(--text-muted);">{{ t('auth.authority_desc') }}</p>
      </div>

      <!-- Card -->
      <form @submit.prevent="handleLogin" class="card p-8 space-y-5 rounded-3xl relative overflow-hidden">
        
        <!-- Subtle Top Accent -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>

        <Transition name="fade">
          <div v-if="error" class="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
            <svg class="w-4 h-4 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-xs text-red-400 font-bold leading-snug">{{ error }}</p>
          </div>
        </Transition>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">{{ t('auth.email_label') }}</label>
          <input
            v-model="email"
            type="email"
            placeholder="admin@ebf.et"
            autocomplete="email"
            class="input-field py-3"
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">{{ t('auth.pass_label') }}</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              class="input-field py-3 pr-11"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
               style="color: var(--text-muted);"
            >
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-primary w-full py-3 mt-3 shadow-lg shadow-blue-600/20 uppercase tracking-widest text-[11px] font-black">
          <span v-if="loading">{{ t('auth.signing_in') }}</span>
          <span v-else>{{ t('auth.sign_in_btn') }}</span>
        </button>
      </form>

      <p class="text-center text-xs mt-8" style="color: var(--text-muted);">
        {{ t('auth.public_viewer_prompt') }}
        <a href="/" class="text-blue-500 hover:underline font-bold">{{ t('auth.view_standings_btn') }} →</a>
      </p>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
