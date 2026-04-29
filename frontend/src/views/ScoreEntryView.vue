<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSeasonLabel } from '@/utils/dateFormatter.js'
import MatchCard from '@/components/MatchCard.vue'
import ScoreInputModal from '@/components/ScoreInputModal.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import { useLeagueStore } from '@/stores/league.js'

const { t } = useI18n()
const league = useLeagueStore()
const selectedMatch = ref(null)
const saveError = ref('')
const saveSuccess = ref('')

async function initScores() {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) {
    await Promise.all([
      league.fetchTeams(league.selectedGender),
      league.fetchMatches(league.activeRound.id)
    ])
    league.subscribeToMatches(league.activeRound.id)
  } else {
    await league.fetchTeams(league.selectedGender)
    league.clearMatches()
  }
}

onMounted(initScores)
watch([() => league.selectedGender, () => league.selectedSeason], initScores)

onUnmounted(() => league.unsubscribeFromMatches())

const completedCount = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)

async function handleSaveScore({ matchId, homeScore, awayScore }) {
  saveError.value = ''
  saveSuccess.value = ''
  try {
    await league.updateMatchScore(matchId, homeScore, awayScore)
    saveSuccess.value = t('admin.saved')
    selectedMatch.value = null
    setTimeout(() => { saveSuccess.value = '' }, 2000)
  } catch (e) {
    saveError.value = e.message || t('admin.failed_save')
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-fade-in pb-20">

    <!-- Compact Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold tracking-tight" style="color: var(--text-heading);">{{ t('admin.score_entry_title') }}</h1>
        <div class="mt-1">
          <GlobalFilter />
        </div>
        <p class="text-[10px] font-bold uppercase tracking-widest mt-2" style="color: var(--text-muted);">
          <template v-if="league.activeRound">
            {{ t('matches.round', { num: league.activeRound.round_number }) }} • {{ getSeasonLabel(league.selectedSeason) }}
          </template>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="league.matches.length > 0" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-500/5 transition-all" style="border-color: var(--border);">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
          <span class="text-[10px] font-bold uppercase tabular-nums" style="color: var(--text-secondary);">{{ t('admin.done_progress', { pct: progressPct }) }}</span>
        </div>
        <RouterLink to="/admin" class="btn-ghost flex items-center h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
          {{ t('nav.dashboard') }}
        </RouterLink>
      </div>
    </div>

    <!-- Progress Border Accent -->
    <div v-if="league.matches.length > 0" class="h-1 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
      <div
        :style="`width: ${progressPct}%`"
        :class="['h-full transition-all duration-700', progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600']"
      ></div>
    </div>

    <!-- Feedback -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold uppercase text-center">
        {{ saveSuccess }}
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase text-center">
        {{ saveError }}
      </div>
    </Transition>

    <!-- Main List -->
    <div class="space-y-2">
      <div v-if="!league.activeRound && !league.loading" class="card p-10 flex flex-col items-center text-center gap-4">
        <p class="text-xs font-bold" style="color: var(--text-secondary);">{{ t('admin.no_active_round_session') }}</p>
        <RouterLink to="/admin/rounds" class="btn-primary text-xs h-8 px-6 uppercase tracking-widest font-black inline-flex items-center justify-center">{{ t('admin.activate_round') }}</RouterLink>
      </div>

      <div v-else-if="league.loading" class="space-y-2">
        <div v-for="i in 8" :key="i" class="h-12 rounded-xl animate-pulse" style="background-color: var(--bg-surface);"/>
      </div>

      <div v-else class="space-y-1.5">
        <div v-if="league.matches.length === 0" class="card p-10 text-center text-[10px] font-bold uppercase" style="color: var(--text-muted);">
          {{ t('admin.no_fixtures_round') }}
        </div>

        <MatchCard
          v-for="match in league.matches"
          :key="match.id"
          :match="match"
          :show-actions="true"
          @edit-score="selectedMatch = $event"
        />
      </div>
    </div>

    <!-- Compact Modal -->
    <ScoreInputModal
      :match="selectedMatch"
      @save="handleSaveScore"
      @close="selectedMatch = null"
    />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.2s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
