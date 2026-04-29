<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatEthiopian } from '@/utils/dateFormatter'
import { getTeamName } from '@/utils/teamName'
import TeamLogo from '@/components/TeamLogo.vue'

const props = defineProps({
  match: { type: Object, required: true },
})

const { t } = useI18n()


const roundLabel = computed(() => 
  props.match.round?.round_number 
    ? t('matches.round', { num: props.match.round.round_number }) 
    : t('nav.standings')
)

const statusLabel = computed(() => {
  if (props.match.status === 'Completed') return t('matches.completed')
  if (props.match.status === 'Forfeited') return t('matches.forfeited')
  return t('matches.scheduled')
})

const displayDate = computed(() => {
  const ethDate = formatEthiopian(props.match.match_date)
  if (props.match.status !== 'Completed' && props.match.match_date) {
    const timeStr = new Date(props.match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${ethDate} ${timeStr}`
  }
  return ethDate
})

</script>

<template>
  <div class="relative overflow-hidden rounded-2xl group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/10"
       style="background-color: var(--bg-card); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    <!-- Inner subtle glow on hover -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent"></div>

    <div class="flex flex-row h-full relative z-10">
      
      <!-- Left: Teams & Scores -->
      <div class="flex-1 p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2.5">
        <!-- Home Team -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <TeamLogo :team="match.home_team" size="w-8 h-8 sm:w-10 sm:h-10" rounded="rounded-full shadow-sm" class="group-hover:scale-105 transition-transform duration-300" />
            <span class="text-[11px] sm:text-sm font-black tracking-tight truncate transition-colors" 
                  :style="match.status === 'Completed' && match.home_score > match.away_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ getTeamName(match.home_team) }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 bg-slate-500/5 px-2 py-0.5 rounded-lg">
            <span class="text-xs sm:text-lg font-black tabular-nums" 
                  :style="match.home_score > match.away_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.home_score }}
            </span>
          </div>
        </div>

        <!-- Away Team -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <TeamLogo :team="match.away_team" size="w-8 h-8 sm:w-10 sm:h-10" rounded="rounded-full shadow-sm" class="group-hover:scale-105 transition-transform duration-300" />
            <span class="text-[11px] sm:text-sm font-black tracking-tight truncate transition-colors" 
                  :style="match.status === 'Completed' && match.away_score > match.home_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ getTeamName(match.away_team) }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 bg-slate-500/5 px-2 py-0.5 rounded-lg">
            <span class="text-xs sm:text-lg font-black tabular-nums" 
                  :style="match.away_score > match.home_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.away_score }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Meta & Game Story -->
      <div class="w-20 sm:w-28 flex-shrink-0 flex flex-col items-center justify-center text-center p-2 relative bg-slate-500/5 group-hover:bg-blue-500/5 transition-colors">
        
        <div class="relative z-10 space-y-0.5">
          <p class="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none" style="color: var(--text-muted);">
            {{ match.status === 'Completed' ? roundLabel : statusLabel }}
          </p>
          <p class="text-[9px] sm:text-[10px] font-black tabular-nums" style="color: var(--text-primary);">
            {{ displayDate }}
          </p>
        </div>

        <!-- Game Story Button / Subtle pill -->
        <div class="mt-2 relative w-full flex justify-center">
          <div class="px-3 py-1.5 sm:py-2 rounded-full cursor-pointer overflow-hidden relative group/story flex items-center justify-center shadow-sm"
               style="background-color: var(--bg-surface);">
            <div class="absolute inset-0 bg-blue-600 opacity-0 group-hover/story:opacity-100 transition-opacity"></div>
            <span class="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover/story:text-white transition-colors">
              {{ t('matches.story') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Remove the custom .card style here, using tailwind utility shadow and rounded classes */
</style>
