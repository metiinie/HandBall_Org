<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
  },
  onRegisterError(error) {
    console.error('SW registration error', error)
  }
})

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="offlineReady || needRefresh"
      class="fixed bottom-4 right-4 z-[9999] flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      style="background-color: var(--bg-card); border-color: var(--border);"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
          <svg v-if="offlineReady" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div class="text-left">
          <p class="text-sm font-bold" style="color: var(--text-primary);">
            {{ offlineReady ? 'App Ready Offline' : 'New Update Available' }}
          </p>
          <p class="text-[11px] opacity-70" style="color: var(--text-secondary);">
            {{ offlineReady ? 'The application has been cached and is ready to work offline.' : 'A new version of the EHF League Management System is ready.' }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button
          v-if="needRefresh"
          @click="updateServiceWorker()"
          class="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          Update Now
        </button>
        <button
          @click="close"
          class="flex-1 sm:flex-none px-4 py-2 rounded-lg border text-xs font-bold transition-all hover:bg-slate-500/10"
          style="border-color: var(--border); color: var(--text-secondary);"
        >
          {{ needRefresh ? 'Later' : 'Close' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
