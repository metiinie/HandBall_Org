<script setup>
import { RouterView } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import ReloadPrompt from '@/components/ReloadPrompt.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

// Close menu when route changes
watch(() => route.path, () => {
  isMenuOpen.value = false
})

onMounted(() => {
  authStore.initAuth()
  // Restore saved theme on app boot
  const saved = localStorage.getItem('ehf-theme')
  if (saved === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col md:flex-row w-full overflow-hidden transition-colors duration-300"
    style="background-color: var(--bg-app); color: var(--text-primary);"
  >
    <!-- Mobile Backdrop — only shown when sidebar is open (admin only) -->
    <Transition name="fade">
      <div 
        v-if="isMenuOpen && authStore.isAuthenticated" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        @click="isMenuOpen = false"
      ></div>
    </Transition>

    <AppSidebar 
      v-if="authStore.isAuthenticated"
      :is-open="isMenuOpen" 
      @close="isMenuOpen = false" 
    />

    <div class="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
      <AppHeader @toggle-menu="toggleMenu" />
      <main class="flex-1 p-2 sm:p-6 lg:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </Transition>
        </RouterView>
      </main>
      
      <!-- PWA Update Prompt -->
      <ReloadPrompt />
    </div>
  </div>
</template>

<style>
.page-enter-active, .page-leave-active { transition: all 0.15s ease-out; }
.page-enter-from  { opacity: 0; transform: translateY(4px); }
.page-leave-to    { opacity: 0; transform: translateY(-4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
