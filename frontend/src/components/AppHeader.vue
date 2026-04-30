<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { usePwaStore } from '@/stores/pwa.js'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n.js'

const authStore = useAuthStore()
const pwaStore = usePwaStore()
const { locale, t } = useI18n()
const isDarkMode = ref(false)

const emit = defineEmits(['toggle-menu'])

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('ehf-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('ehf-theme', 'light')
  }
}

function changeLanguage(newLocale) {
  setLocale(newLocale)
}

onMounted(() => {
  isDarkMode.value = localStorage.getItem('ehf-theme') === 'dark'
  if (isDarkMode.value) document.documentElement.classList.add('dark')
})
</script>

<template>
  <header
    class="h-16 flex items-center justify-between px-4 sm:px-6 border-b z-30 transition-colors duration-300 backdrop-blur-md sticky top-0"
    style="background-color: var(--bg-card); border-color: var(--border);"
  >
    <!-- Left: Menu Toggle & Brand -->
    <div class="flex items-center gap-3 sm:gap-8">
      <!-- Hamburger (Mobile only) -->
      <button 
        @click="emit('toggle-menu')"
        class="md:hidden p-2 rounded-lg hover:bg-slate-500/10 transition-colors"
        style="color: var(--text-secondary);"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      <!-- Public Branding -->
      <RouterLink to="/" class="flex items-center gap-2 group">
        <div class="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105 flex-shrink-0"
             style="background-color: var(--bg-surface); border-color: var(--border);">
          <img src="/logos/ehf.png" class="w-full h-full object-cover" alt="EHF League"/>
        </div>
        <div class="hidden xs:block">
          <h1 class="font-black text-[10px] sm:text-xs tracking-widest leading-none uppercase" style="color: var(--text-heading);">EHF LEAGUE</h1>
          <p class="text-[7px] sm:text-[8px] font-black tracking-widest uppercase mt-0.5 opacity-60" style="color: var(--text-muted);">{{ t('nav.match_ops') }}</p>
        </div>
      </RouterLink>

      <!-- Desktop & Mobile Links -->
      <div class="flex items-center gap-4 sm:gap-6">
        <RouterLink
          to="/"
          class="text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-colors"
          :class="$route.path === '/' ? '!text-blue-500' : 'text-slate-500 hover:text-blue-500'"
        >{{ t('nav.standings') }}</RouterLink>
        <RouterLink
          to="/matches"
          class="text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-colors"
          :class="$route.path === '/matches' ? '!text-blue-500' : 'text-slate-500 hover:text-blue-500'"
        >{{ t('nav.matches') }}</RouterLink>
      </div>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-2 sm:gap-4">
      <!-- Language Switcher -->
      <div class="flex items-center gap-1 p-0.5 rounded-lg border" style="background-color: var(--bg-surface); border-color: var(--border);">
        <button 
          @click="changeLanguage('en')"
          class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black uppercase rounded transition-all"
          :class="locale === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500'"
        >EN</button>
        <button 
          @click="changeLanguage('am')"
          class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black rounded transition-all"
          :class="locale === 'am' ? 'bg-blue-600 text-white' : 'text-slate-500'"
        >አማ</button>
      </div>

      <!-- Theme Toggle -->
      <button @click="toggleTheme" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-slate-500/10 transition-colors">
        <svg v-if="!isDarkMode" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        <svg v-else class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      </button>

      <!-- Install PWA Button -->
      <button 
        v-if="pwaStore.isInstallable"
        @click="pwaStore.triggerInstall"
        class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-lg shadow-blue-500/20"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span class="text-[10px] font-bold uppercase tracking-wider">Install App</span>
      </button>
      
      <!-- Mobile Install Icon -->
      <button 
        v-if="pwaStore.isInstallable"
        @click="pwaStore.triggerInstall"
        class="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
 
      <!-- Profile / Login -->
      <RouterLink
        :to="authStore.isAuthenticated ? '/admin' : '/login'"
        class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all hover:ring-2 hover:ring-blue-500/50 hover:scale-105 active:scale-95"
        style="background-color: var(--bg-surface); border: 1px solid var(--border);"
        :title="authStore.isAuthenticated ? 'Admin Dashboard' : 'Login to Admin'"
      >
        <svg class="w-4 h-4 flex-shrink-0" style="color: var(--text-muted);" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
      </RouterLink>
    </div>
  </header>
</template>
