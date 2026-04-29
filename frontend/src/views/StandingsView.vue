<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSeasonLabel } from '@/utils/dateFormatter.js'
import StandingsTable from '@/components/StandingsTable.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import { useLeagueStore } from '@/stores/league.js'
import { useGlobalStore } from '@/stores/global.js'

const { t } = useI18n()
const league = useLeagueStore()
const global = useGlobalStore()

const selectedRound = ref(null)
const isCumulative = ref(false)

const displayStandings = computed(() => {
  if (selectedRound.value === 'global') return global.globalStandings
  if (isCumulative.value) return league.cumulativeStandings
  return league.standings
})

async function refreshData() {
  if (!selectedRound.value) return
  
  if (selectedRound.value === 'global') {
    await global.fetchGlobalStandings()
  } else {
    await Promise.all([
      league.fetchTeams(league.selectedGender),
      league.fetchMatches(selectedRound.value),
      league.subscribeToMatches(selectedRound.value),
    ])
    if (isCumulative.value) {
      await league.fetchCumulativeMatches(selectedRound.value)
    }
  }
}

onMounted(async () => {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
})

watch(() => league.selectedSeason, async (newSeason) => {
  await league.fetchRounds(newSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
  else selectedRound.value = null
})

watch(() => league.selectedGender, async () => {
  league.clearRounds()
  league.clearMatches()
  selectedRound.value = null
  
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
})

watch(selectedRound, () => {
  refreshData()
})

watch(isCumulative, async (newVal) => {
  if (newVal && selectedRound.value !== 'global' && selectedRound.value) {
     await league.fetchCumulativeMatches(selectedRound.value)
  }
})

const currentRound = () => league.rounds.find(r => r.id === selectedRound.value)
const roundLabel = () => {
  if (selectedRound.value === 'global') return t('standings.global_season')
  const r = currentRound()
  return r ? t('matches.round', { num: r.round_number }) : ''
}
const seasonYearLabel = () => getSeasonLabel(league.selectedSeason)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

    <!-- Hero Banner -->
    <div class="card p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-200/50">
            <img src="/logos/ehf.png" alt="EHF Logo" class="w-full h-full object-contain p-1.5" />
          </div>
          <div>
            <h1 class="text-xl font-black tracking-tight leading-none mb-1" style="color: var(--text-heading);">{{ t('standings.ehf_standings') }}</h1>
            <p class="text-xs font-medium capitalize tracking-wide" style="color: var(--text-muted);">{{ t('standings.ehf_full') }}</p>
          </div>
        </div>
        <div v-if="league.activeRound" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold tracking-wide text-emerald-500 uppercase tabular-nums">
            {{ t('standings.live_round', { num: league.activeRound.round_number }) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Global NBA-style Filters -->
    <GlobalFilter />

    <!-- Round Selector -->
    <div class="space-y-1.5 pt-2">
      <h3 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-muted);">{{ t('standings.select_round') }}</h3>
      <RoundSelector
        v-model="selectedRound"
        :rounds="league.rounds"
        :show-global="true"
      />
    </div>

    <!-- Standings Table -->
    <StandingsTable
      :standings="displayStandings"
      :loading="league.loading || global.loading"
      :round-label="roundLabel()"
      :gender="league.selectedGender"
      :season-year="seasonYearLabel()"
      :is-global="selectedRound === 'global'"
      :show-exports="true"
      v-model:cumulative="isCumulative"
    />

    <!-- FIBA Rules Note -->
    <div class="card p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg shrink-0" style="background-color: var(--bg-surface);">
        <svg class="w-4 h-4" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div class="text-xs space-y-1" style="color: var(--text-muted);">
        <p class="font-bold uppercase tracking-wider text-[10px] mb-1" style="color: var(--text-secondary);">{{ t('standings.ihf_title') || 'IHF Official Tie-Breaking Order' }}</p>
        <p v-html="t('standings.ihf_rule_1') || '1. Points in head-to-head matches among tied teams'"></p>
        <p v-html="t('standings.ihf_rule_points') || 'Win: 2 pts • Draw: 1 pt • Loss: 0 pts • Forfeit: 10-0'"></p>
      </div>
    </div>
  </div>
</template>
