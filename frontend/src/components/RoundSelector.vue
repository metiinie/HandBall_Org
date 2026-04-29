<script setup>
import { useI18n } from 'vue-i18n'
import { getSeasonLabel } from '@/utils/dateFormatter.js'

defineProps({
  rounds: { type: Array, default: () => [] },
  modelValue: { type: String, default: null }, // selected round id or 'global'
  showGlobal: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const statusColors = {
  Active: 'text-emerald-400 border-emerald-400/30',
  Completed: 'text-blue-400 border-blue-400/30',
  Pending: 'text-slate-500 border-slate-700/50',
  Forfeited: 'text-rose-400 border-rose-400/30',
}
</script>

<template>
  <!-- Removed excessive py-6 pb-20 padding that was baked in and bloating every parent layout -->
  <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
    <!-- Round Pills -->
    <button
      v-for="round in rounds"
      :key="round.id"
      @click="emit('update:modelValue', round.id)"
      :class="[
        'snap-start flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200',
        modelValue === round.id
          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30'
          : 'hover:border-blue-500/50 hover:text-blue-500',
      ]"
      :style="modelValue !== round.id ? 'background-color: var(--bg-card); border-color: var(--border); color: var(--text-muted);' : ''"
    >
      <span class="text-[10px] font-black uppercase tracking-widest opacity-60">{{ getSeasonLabel(round.season_year) }}</span>
      <span class="font-black">{{ t('matches.round', { num: round.round_number }) }}</span>
      <span :class="['text-[9px] mt-0.5 font-bold uppercase tracking-widest', modelValue === round.id ? 'text-white/80' : statusColors[round.status] || 'text-gray-500']">
        {{ round.status === 'Active' ? t('global.active') : round.status === 'Completed' ? t('matches.history') : t('matches.draft') }}
      </span>
    </button>

    <!-- Global Season -->
    <button
      v-if="showGlobal"
      @click="emit('update:modelValue', 'global')"
      :class="[
        'snap-start flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200',
        modelValue === 'global'
          ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-lg shadow-amber-400/30'
          : 'hover:border-amber-400/50 hover:text-amber-400',
      ]"
      :style="modelValue !== 'global' ? 'background-color: var(--bg-card); border-color: var(--border); color: var(--text-muted);' : ''"
    >
      <svg class="w-4 h-4 mb-0.5" :class="modelValue === 'global' ? 'text-slate-950' : 'text-amber-400'"
        fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span class="font-black">{{ t('standings.global_season').split(' ')[0] }}</span>
      <span class="text-[9px] mt-0.5 font-bold uppercase tracking-widest opacity-70">{{ t('global.season') }}</span>
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
