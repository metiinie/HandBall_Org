<script setup>
import { useI18n } from 'vue-i18n'
import { getTeamName } from '@/utils/teamName.js'
import { formatEthiopian } from '@/utils/dateFormatter.js'
import TeamLogo from '@/components/TeamLogo.vue'

const { t } = useI18n()
const props = defineProps({
  match: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
})
const emit = defineEmits(['edit-score'])

const statusConfig = {
  Scheduled: { label: t('matches.scheduled'), cls: 'badge-win' },
  Pending:   { label: t('matches.scheduled'), cls: 'badge-pending' },
  Completed: { label: t('matches.completed'), cls: 'badge-completed' },
  Forfeited: { label: t('matches.forfeited'), cls: 'badge-loss' },
}

function formattedDateTime(dateStr) {
  if (!dateStr) return null
  // The second argument to formatEthiopian should be the locale string, not an options object.
  // We will append the time manually if needed, or simply return the formatted date.
  const dateStrFormatted = formatEthiopian(dateStr)
  const timeStr = new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${dateStrFormatted} - ${timeStr}`
}
</script>

<template>
  <div class="card px-4 py-2 hover:shadow-sm transition-all duration-200 group">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden">
      
      <!-- Metadata (Compact Stack) -->
      <div class="flex flex-row sm:flex-col flex-wrap sm:flex-shrink-0 sm:min-w-[90px] gap-x-3 gap-y-0.5 sm:border-r sm:pr-3" style="border-color: var(--border);">
        <span v-if="formattedDateTime(match.match_date)" class="text-[9px] font-bold whitespace-nowrap tabular-nums" style="color: var(--text-muted);">
          🕒 {{ formattedDateTime(match.match_date) }}
        </span>
        <span v-if="match.venue" class="text-[9px] font-bold truncate flex items-center gap-1 uppercase" style="color: var(--text-muted);">
          📍 {{ match.venue }}
        </span>
      </div>

      <!-- Main Row: Teams & Score -->
      <div class="flex-1 flex items-center gap-3 min-w-0">
        <!-- Home -->
        <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span class="text-[11px] font-bold truncate text-right leading-none" style="color: var(--text-primary);">
            {{ getTeamName(match.home_team) || '—' }}
          </span>
          <TeamLogo :team="match.home_team" size="w-7 h-7" rounded="rounded-lg" />
        </div>

        <!-- Score/VS Block -->
        <div class="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[70px]">
          <div v-if="match.status === 'Completed' || match.status === 'Forfeited'" class="flex items-center gap-1.5 leading-none mt-0.5">
            <span class="text-base font-bold tabular-nums" style="color: var(--text-heading);">{{ match.home_score }}</span>
            <span class="text-xs font-bold opacity-30" style="color: var(--text-muted);">:</span>
            <span class="text-base font-bold tabular-nums" style="color: var(--text-heading);">{{ match.away_score }}</span>
          </div>
          <div v-else class="text-[8px] font-black tracking-widest text-slate-500 uppercase italic">VS</div>
          
          <div class="flex items-center gap-1 -mt-0.5">
            <span :class="statusConfig[match.status]?.cls || 'badge-pending'" 
                  class="text-[7.5px] leading-tight px-1.5 rounded-full font-bold uppercase">
              {{ statusConfig[match.status]?.label || match.status }}
            </span>
            <span v-if="match.is_ot" class="text-[7.5px] leading-tight px-1.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
              ET
            </span>
          </div>
        </div>

        <!-- Away -->
        <div class="flex-1 flex items-center justify-start gap-2 min-w-0">
          <TeamLogo :team="match.away_team" size="w-7 h-7" rounded="rounded-lg" />
          <span class="text-[11px] font-bold truncate leading-none" style="color: var(--text-primary);">
            {{ getTeamName(match.away_team) || '—' }}
          </span>
        </div>
      </div>

      <!-- Action Button (Horizontal Position) -->
      <div v-if="showActions" class="border-l pl-3" style="border-color: var(--border);">
        <button
          @click="emit('edit-score', match)"
          class="btn-primary py-0 px-3 text-[10px] uppercase font-bold tracking-wider rounded-lg h-7 whitespace-nowrap flex items-center transition-transform active:scale-95"
        >
          {{ t('admin.enter_scores') }}
        </button>
      </div>

    </div>
  </div>
</template>
