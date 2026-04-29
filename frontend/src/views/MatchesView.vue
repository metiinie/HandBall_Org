<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HandballGameCard from '@/components/HandballGameCard.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import { useLeagueStore } from '@/stores/league.js'
import { formatEthiopian } from '@/utils/dateFormatter'

const { t } = useI18n()
const league = useLeagueStore()
const selectedRound = ref(null)
const filter = ref('All')

onMounted(async () => {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
  if (selectedRound.value) await league.fetchMatches(selectedRound.value)
})

async function onRoundChange(id) {
  if (!id || id === 'global') return
  selectedRound.value = id
  await league.fetchMatches(id)
}

const matchesByDate = computed(() => {
  const list = filter.value === 'All' ? league.matches : 
               filter.value === 'Today' ? league.matches.filter(m => {
                 const d = new Date(m.match_date).toDateString()
                 return d === new Date().toDateString()
               }) : league.matches.filter(m => {
                 if (filter.value === 'Scheduled') return m.status === 'Scheduled'
                 if (filter.value === 'Completed') return m.status === 'Completed' || m.status === 'Forfeited'
                 return true
               })

  const groups = {}
  list.forEach(m => {
    // Group by ISO date to avoid TZ issues
    const day = new Date(m.match_date).toISOString().split('T')[0]
    if (!groups[day]) groups[day] = []
    groups[day].push(m)
  })
  
  return Object.entries(groups).map(([date, matches]) => ({ 
    date, 
    localized: formatEthiopian(date),
    matches 
  })).sort((a, b) => new Date(a.date) - new Date(b.date))
})

const allDates = computed(() => {
  const dates = league.matches.map(m => new Date(m.match_date).toISOString().split('T')[0])
  const unique = [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b))
  return unique.map(d => ({
    raw: d,
    label: formatEthiopian(d)
  }))
})

const scrollToDate = (rawDate) => {
  const el = document.getElementById(`date-${rawDate}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-4 space-y-4 animate-fade-in pb-12">
    
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-black tracking-tight" style="color: var(--text-heading);">{{ t('matches.title') }}</h1>
        <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-muted);">IHF Standard Timing & Scoring</p>
      </div>
      <div class="w-full md:w-auto">
        <GlobalFilter />
      </div>
    </div>

    <!-- Controls & Date Strip -->
    <div class="space-y-4">
      <div class="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div class="w-full lg:max-w-xs">
          <RoundSelector
            :model-value="selectedRound"
            @update:model-value="onRoundChange"
            :rounds="league.rounds"
            :show-global="false"
          />
        </div>

        <!-- Status Filters -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in ['All', 'Today', 'Scheduled', 'Completed']"
            :key="f"
            @click="filter = f"
            :class="['px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all',
              filter === f ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : '']"
            :style="filter !== f ? 'color: var(--text-secondary); background-color: var(--bg-card); border-color: var(--border);' : ''"
          >
            {{ t(`matches.${f.toLowerCase()}`) }}
          </button>
        </div>
      </div>

      <!-- Handball Horizontal Date Strip -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          v-for="date in allDates" 
          :key="date.raw"
          @click="scrollToDate(date.raw)"
          class="flex-shrink-0 px-6 py-3 rounded-xl border transition-all text-center min-w-[100px] hover:shadow-md active:scale-95"
          style="background-color: var(--bg-card); border-color: var(--border);"
        >
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{{ t('matches.date_label') }}</p>
          <p class="text-sm font-black" style="color: var(--text-primary);">{{ date.label }}</p>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="league.loading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 6" :key="i"
        class="h-32 rounded-2xl animate-pulse"
        style="background-color: var(--bg-surface);"/>
    </div>

    <!-- Matches Grouped by Date -->
    <div v-else-if="matchesByDate.length > 0" class="space-y-4">
      <div v-for="group in matchesByDate" :key="group.date" 
           :id="`date-${group.date}`"
           class="space-y-2 scroll-mt-24">
        <!-- Date Header -->
        <h2 class="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-slate-500/5 mb-0.5 inline-block" 
            style="color: var(--text-secondary);">
          {{ group.localized }}
        </h2>
        
        <!-- Game Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HandballGameCard v-for="match in group.matches" :key="match.id" :match="match"/>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="card p-20 flex flex-col items-center text-center gap-4">
      <div class="w-16 h-16 rounded-3xl bg-slate-500/5 flex items-center justify-center">
        <svg class="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </div>
      <div>
        <p class="font-bold text-lg" style="color: var(--text-secondary);">{{ t('matches.no_games') }}</p>
        <p class="text-sm" style="color: var(--text-muted);">{{ t('matches.check_back') }}</p>
      </div>
    </div>

  </div>
</template>
