<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}

const navLinks = computed(() => {
  if (authStore.isAuthenticated) {
    return [
      { name: t('nav.dashboard'),   to: '/admin',           icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { name: t('nav.scheduler'),   to: '/admin/scheduler', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: t('nav.scores'),      to: '/admin/scores',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { name: t('nav.rounds'),      to: '/admin/rounds',    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { name: t('nav.teams'),       to: '/admin/teams',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    ]
  }
  return []
})

function isActive(link) {
  // Each nav link is only active on its own exact path (or prefix for sub-routes it owns)
  if (link.to === '/') {
    return route.path === '/'
  }
  if (link.to === '/admin') {
    return route.path === '/admin'   // Dashboard: exact match only, not all sub-routes
  }
  return route.path.startsWith(link.to)
}
</script>

<template>
  <aside
    class="fixed md:sticky top-0 left-0 z-50 w-64 h-screen transition-transform duration-300 transform md:transform-none flex flex-col"
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      'md:flex'
    ]"
    style="background-color: var(--bg-card); border-right: 1px solid var(--border);"
  >
    <!-- Close Button (Mobile Only) -->
    <button 
      @click="emit('close')"
      class="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-500/10 transition-colors"
      style="color: var(--text-muted);"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Logo -->
    <div class="h-16 flex items-center px-5" style="border-bottom: 1px solid var(--border);">
      <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/10 mr-3.5 flex-shrink-0 border"
           style="background-color: var(--bg-surface); border-color: var(--border);">
        <img src="/logos/ehf.png" class="w-full h-full object-cover" alt="EHF League Logo"/>
      </div>
      <div>
        <h1 class="font-black text-sm tracking-[0.15em] leading-none uppercase" style="color: var(--text-heading);">EHF LEAGUE</h1>
        <p class="text-[9px] font-black tracking-[0.2em] uppercase mt-1 leading-none" style="color: var(--text-muted);">{{ t('nav.match_ops') }}</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
        :style="isActive(link)
          ? 'background-color: rgba(59,130,246,0.12); color: #3b82f6;'
          : 'color: var(--text-secondary);'"
      >
        <svg
          class="w-4 h-4 flex-shrink-0 transition-colors"
          :style="isActive(link) ? 'color: #3b82f6;' : 'color: var(--text-muted);'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon"/>
        </svg>
        <span class="font-medium text-sm">{{ link.name }}</span>
      </RouterLink>
    </nav>

    <!-- Bottom -->
    <div class="px-3 pb-5 mt-auto">
      <button
        v-if="authStore.isAuthenticated"
        @click="handleSignOut"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 hover:text-red-500 hover:bg-red-500/10"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span class="font-medium text-sm">{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>
