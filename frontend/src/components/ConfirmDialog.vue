<script setup>
defineProps({
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure?' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="emit('cancel')">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('cancel')" />

      <!-- Dialog -->
      <div class="relative card p-6 w-full max-w-sm animate-slide-up">
        <!-- Icon -->
        <div class="mb-4 flex justify-center">
          <div :class="danger ? 'bg-red-500/10' : 'bg-blue-500/10'"
               class="w-14 h-14 rounded-2xl flex items-center justify-center border"
               :style="danger ? 'border-color: rgba(239, 68, 68, 0.2)' : 'border-color: rgba(59, 130, 246, 0.2)'">
            <svg v-if="danger" class="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <svg v-else class="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <h3 class="text-lg font-bold text-center mb-2" style="color: var(--text-heading);">{{ title }}</h3>
        <p class="text-sm text-center mb-6" style="color: var(--text-muted);">{{ message }}</p>

        <div class="flex gap-3">
          <button @click="emit('cancel')" class="flex-1 btn-ghost" :disabled="loading">
            {{ cancelLabel }}
          </button>
          <button
            @click="emit('confirm')"
            :class="danger ? 'btn-danger' : 'btn-primary'"
            class="flex-1"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Processing...
            </span>
            <span v-else>{{ confirmLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
