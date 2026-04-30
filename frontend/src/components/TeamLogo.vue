<script setup>
import { ref, watch, computed } from 'vue'
import { BASE_SERVER_URL } from '@/lib/api.js'

const props = defineProps({
  team: { type: Object, default: null },
  size: { type: String, default: 'w-10 h-10' },
  rounded: { type: String, default: 'rounded-xl' }
})

const error = ref(false)

// Reset error if team or logo_url changes
watch(() => props.team?.logo_url, () => {
  error.value = false
})

function handleError() {
  error.value = true
}

const resolvedLogo = computed(() => {
  const url = props.team?.logo_url
  if (!url) return null
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return BASE_SERVER_URL + url
})
</script>

<template>
  <div 
    :class="[size, rounded, 'overflow-hidden flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-300']"
    style="background-color: var(--bg-surface); border-color: var(--border);"
  >
    <img 
      v-if="team?.logo_url && !error" 
      :src="resolvedLogo" 
      crossorigin="anonymous"
      @error="handleError"
      class="w-full h-full object-cover"
    />
    <img 
      v-else 
      src="/logos/generic.png" 
      class="w-full h-full object-cover opacity-80"
      :alt="team?.name || 'Team Logo'"
    />
  </div>
</template>
