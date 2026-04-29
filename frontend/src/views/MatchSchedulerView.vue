<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSeasonLabel } from '@/utils/dateFormatter.js'
import { useLeagueStore } from '@/stores/league.js'
import { getTeamName } from '@/utils/teamName.js'
import { formatEthiopian } from '@/utils/dateFormatter.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'

const { t } = useI18n()
const router = useRouter()
const league = useLeagueStore()

const matchData = ref({
  home_team_id: '',
  away_team_id: '',
  match_date: '',
  venue: ''
})

// Round picker — defaults to active round, but can be changed by the admin
const selectedRoundId = ref(null)
let _initializingScheduler = false  // flag to suppress the watcher during init

const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const editingMatch = ref(null)
const showConfirmDelete = ref(false)
const matchToDelete = ref(null)

async function initScheduler() {
  _initializingScheduler = true
  try {
    await league.fetchRounds(league.selectedSeason)
    await league.fetchTeams() // Fetch all teams once, computed will filter by gender
    // Default the round picker to the active round for this gender
    selectedRoundId.value = league.activeRound?.id ?? (league.rounds[0]?.id ?? null)
    if (selectedRoundId.value) {
      await league.fetchMatches(selectedRoundId.value)
    } else {
      league.clearMatches()
    }
  } finally {
    _initializingScheduler = false
  }
}

onMounted(initScheduler)

watch(() => league.selectedSeason, initScheduler)

watch(() => league.selectedGender, async () => {
  // Immediately clear stale data so old gender's rounds never flash in the UI
  league.clearRounds()             // clears rounds[] and activeRound atomically
  league.clearMatches()
  selectedRoundId.value = null
  matchData.value.home_team_id = ''
  matchData.value.away_team_id = ''
  // Now fetch fresh data for the new gender
  await initScheduler()
})

// When admin manually picks a different round, reload matches for it
// Guard: do NOT fire during initScheduler (it already fetches matches)
watch(selectedRoundId, async (newId) => {
  if (_initializingScheduler) return
  if (newId) await league.fetchMatches(newId)
  else league.clearMatches()
})

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === league.selectedGender)
)

const recentSchedules = computed(() =>
  league.matches
    .filter(m => m.status === 'Pending' || m.status === 'Scheduled' || m.status === 'Completed')
    .sort((a,b) => new Date(b.match_date) - new Date(a.match_date))
    .slice(0, 8)
)

async function scheduleMatch() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!selectedRoundId.value) {
    errorMsg.value = t('admin.no_active_round_warn') || 'Please select a round first.'
    return
  }
  if (!matchData.value.home_team_id || !matchData.value.away_team_id) {
    errorMsg.value = t('admin.select_both_teams')
    return
  }
  if (matchData.value.home_team_id === matchData.value.away_team_id) {
    errorMsg.value = t('admin.diff_teams_err')
    return
  }
  if (!matchData.value.match_date) {
    errorMsg.value = t('admin.specify_date_err')
    return
  }

  submitting.value = true
  try {
    const payload = {
      round_id: selectedRoundId.value, // Use the selected round, not just the active one
      home_team_id: matchData.value.home_team_id,
      away_team_id: matchData.value.away_team_id,
      match_date: new Date(matchData.value.match_date).toISOString(),
      venue: matchData.value.venue,
      status: 'Scheduled'
    }

    if (editingMatch.value) {
      await league.updateMatch(editingMatch.value.id, payload)
      successMsg.value = t('admin.match_updated_success') || 'Match updated.'
    } else {
      await league.createMatch(payload)
      successMsg.value = t('admin.match_scheduled_success')
    }

    resetForm()
    setTimeout(() => successMsg.value = '', 4000)
  } catch (err) {
    errorMsg.value = err.message || t('admin.failed_schedule')
  } finally {
    submitting.value = false
  }
}

// Helper: label for the selected round
const selectedRoundLabel = computed(() => {
  const r = league.rounds.find(r => r.id === selectedRoundId.value)
  if (!r) return '—'
  const statusTag = r.status === 'Active' ? ' 🟢' : r.status === 'Completed' ? ' ✓' : ''
  return `${t('matches.round', { num: r.round_number })}${statusTag}`
})

function resetForm() {
    matchData.value = { home_team_id: '', away_team_id: '', match_date: '', venue: '' }
    editingMatch.value = null
    // Restore to active round after cancel/reset
    selectedRoundId.value = league.activeRound?.id ?? selectedRoundId.value
}

function editMatch(match) {
    editingMatch.value = match
    matchData.value = {
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        match_date: match.match_date ? new Date(match.match_date).toISOString().slice(0, 16) : '',
        venue: match.venue || ''
    }
    // Pre-select the round the match already belongs to
    selectedRoundId.value = match.round_id ?? selectedRoundId.value
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function confirmDelete(match) {
    matchToDelete.value = match
    showConfirmDelete.value = true
}

async function handleDelete() {
    if (!matchToDelete.value) return
    submitting.value = true
    try {
        await league.deleteMatch(matchToDelete.value.id)
        showConfirmDelete.value = false
        matchToDelete.value = null
    } catch (err) {
        errorMsg.value = err.message
    } finally {
        submitting.value = false
    }
}

const statusBadge = (status) => {
  const map = {
    Completed: 'badge-completed',
    Scheduled: 'badge-win',
    Pending:   'badge-pending',
  }
  return map[status] ?? 'badge-pending'
}

const formatMatchDate = (d) => d ? formatEthiopian(d) : '—'
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-3">
      <RouterLink to="/admin" class="btn-icon flex items-center justify-center">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </RouterLink>
      <div>
        <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">{{ t('admin.scheduler_title') }}</h1>
        <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ t('admin.scheduler_desc') }}</p>
      </div>
    </div>

    <!-- Active Round Banner -->
    <div v-if="league.activeRound" class="card px-5 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
        <div>
          <p class="text-xs font-bold" style="color: var(--text-primary);">{{ t('admin.active_round_banner', { num: league.activeRound.round_number, year: getSeasonLabel(league.activeRound.season_year) }) }}</p>
          <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">{{ t('admin.assigned_round_desc') }}</p>
        </div>
      </div>
      <span class="badge-completed px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold">{{ t('global.active') || 'Active' }}</span>
    </div>

    <div v-else class="card px-5 py-3.5 border-amber-500/30 bg-amber-500/10">
      <p class="text-xs font-semibold text-amber-500">⚠ {{ t('admin.no_active_round_warn') }}</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Form Card -->
      <div class="lg:col-span-8">
        <form @submit.prevent="scheduleMatch" class="card p-6 space-y-5 shadow-2xl shadow-blue-600/5">

          <div class="pb-4" style="border-bottom: 1px solid var(--border);">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">
                {{ editingMatch ? (t('admin.edit_match') || 'Edit Fixture') : t('admin.new_fixture') }}
            </h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ t('admin.fixture_desc') }}</p>
          </div>

          <!-- Filter bar: Gender / Season / Round — all inline -->
          <div class="p-4 rounded-xl border bg-slate-500/5" style="border-color: var(--border);">
            <div class="flex flex-wrap items-end gap-x-6 gap-y-3">

              <!-- Gender -->
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{{ t('global.league') }}</p>
                <select
                  :value="league.selectedGender"
                  @change="league.selectedGender = $event.target.value"
                  class="appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-black tracking-tight cursor-pointer hover:text-blue-500 transition-colors focus:outline-none" style="color: var(--text-primary);"
                >
                  <option value="ወንድ">{{ t('gender.men_league') }}</option>
                  <option value="ሴት">{{ t('gender.women_league') }}</option>
                </select>
              </div>

              <div class="w-px h-8 self-end mb-1" style="background-color: var(--border);"></div>

              <!-- Season -->
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{{ t('global.season') }}</p>
                <select
                  :value="league.selectedSeason"
                  @change="league.selectedSeason = parseInt($event.target.value)"
                  class="appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-black tracking-tight cursor-pointer hover:text-blue-500 transition-colors focus:outline-none" style="color: var(--text-primary);"
                >
                  <option :value="2025">2018</option>
                </select>
              </div>

              <div class="w-px h-8 self-end mb-1" style="background-color: var(--border);"></div>

              <!-- Round Picker — right next to Season -->
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{{ t('matches.round', { num: '' }).trim() }}</p>
                <select
                  v-model="selectedRoundId"
                  class="appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-black tracking-tight cursor-pointer hover:text-blue-500 transition-colors focus:outline-none" style="color: var(--text-primary);"
                >
                  <option :value="null" disabled>—</option>
                  <option v-for="r in league.rounds" :key="r.id" :value="r.id">
                    {{ t('matches.round', { num: r.round_number }) }}{{ r.status === 'Active' ? ' 🟢' : r.status === 'Completed' ? ' ✓' : '' }}
                  </option>
                </select>
              </div>

            </div>
          </div>

          <!-- Teams Selection -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">{{ t('admin.home_team') }}</label>
              <select v-model="matchData.home_team_id" required class="input-field">
                <option value="" disabled>{{ t('admin.select_home') }}</option>
                <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.away_team_id">
                  {{ getTeamName(team) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">{{ t('admin.away_team') }}</label>
              <select v-model="matchData.away_team_id" required class="input-field">
                <option value="" disabled>{{ t('admin.select_away') }}</option>
                <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.home_team_id">
                  {{ getTeamName(team) }}
                </option>
              </select>
            </div>
          </div>

          <!-- VS Badge Preview -->
          <div v-if="matchData.home_team_id && matchData.away_team_id"
            class="flex flex-col sm:flex-row items-center gap-3 px-4 py-3 rounded-lg border text-center"
            style="background-color: var(--bg-surface); border-color: var(--border);">
            <div class="flex-1 min-w-0 w-full sm:text-right">
              <span class="text-xs font-bold block truncate" style="color: var(--text-primary);">
                {{ getTeamName(filteredTeams.find(t => t.id === matchData.home_team_id)) }}
              </span>
            </div>
            <span class="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-blue-600/20 text-blue-500 border border-blue-600/30">VS</span>
            <div class="flex-1 min-w-0 w-full sm:text-left">
              <span class="text-xs font-bold block truncate" style="color: var(--text-primary);">
                {{ getTeamName(filteredTeams.find(t => t.id === matchData.away_team_id)) }}
              </span>
            </div>
          </div>

          <!-- Date / Time & Venue -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Date / Time -->
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">{{ t('admin.date_time') }}</label>
              <input type="datetime-local" v-model="matchData.match_date" required class="input-field"/>
            </div>
            <!-- Venue -->
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">{{ t('admin.venue') }} <span class="font-normal" style="color: var(--text-muted);">(optional)</span></label>
              <input type="text" v-model="matchData.venue" placeholder="e.g. Haile Court" class="input-field"/>
            </div>
          </div>

          <!-- Feedback -->
          <div v-if="errorMsg" class="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
            {{ errorMsg }}
          </div>
          <div v-if="successMsg" class="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
            {{ successMsg }}
          </div>

          <!-- Action Row -->
          <div class="flex items-center justify-between pt-4" style="border-top: 1px solid var(--border);">
            <div class="flex items-center gap-3">
                <p class="text-[10px] font-bold" style="color: var(--text-muted);">→ {{ selectedRoundLabel }}</p>
                <button v-if="editingMatch" type="button" @click="resetForm" class="text-[10px] font-bold text-red-500 uppercase tracking-widest">{{ t('admin.cancel') }}</button>
            </div>
            <button type="submit" :disabled="submitting || !selectedRoundId" class="btn-primary min-w-[160px] h-10 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
              <span v-if="submitting">{{ editingMatch ? (t('admin.updating') || 'Updating…') : t('admin.scheduling') }}</span>
              <span v-else>{{ editingMatch ? (t('admin.update_match') || 'Save Changes') : t('admin.schedule_match_btn') }}</span>
            </button>
          </div>

        </form>
      </div>

      <!-- Recent Sidebar -->
      <div class="lg:col-span-4">
        <div class="card overflow-hidden h-full flex flex-col">
          <div class="px-5 py-4 flex items-center gap-2" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
            <svg class="w-3.5 h-3.5" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-secondary);">{{ t('admin.recent_fixtures') }}</p>
          </div>

          <div class="flex-1 divide-y" style="border-color: var(--border);">
            <div v-for="match in recentSchedules" :key="match.id" class="px-5 py-3.5 hover:bg-slate-500/5 transition-colors">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tabular-nums" :class="statusBadge(match.status)">
                    {{ match.status === 'Scheduled' ? t('matches.scheduled') : (match.status === 'Completed' ? t('matches.history') : match.status) }}
                  </span>
                  <!-- Round badge in sidebar -->
                  <span class="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tabular-nums bg-blue-500/10 text-blue-400 border-blue-500/20">
                    R{{ match.round?.round_number ?? '?' }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="editMatch(match)" class="p-1 hover:text-blue-500 transition-colors">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button @click="confirmDelete(match)" class="p-1 hover:text-red-500 transition-colors">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                    <span class="text-[10px] font-bold tabular-nums ml-1" style="color: var(--text-muted);">
                        {{ formatMatchDate(match.match_date) }}
                    </span>
                </div>
              </div>
              <p class="text-xs font-bold" style="color: var(--text-primary);">
                {{ getTeamName(match.home_team) }} <span style="color: var(--text-muted);">vs</span> {{ getTeamName(match.away_team) }}
              </p>
              <p v-if="match.venue" class="text-[10px] mt-1" style="color: var(--text-muted);">📍 {{ match.venue }}</p>
            </div>
            <div v-if="!recentSchedules.length" class="py-10 text-center text-xs" style="color: var(--text-muted);">No fixtures yet.</div>
          </div>

          <div class="px-5 py-3.5" style="background-color: var(--bg-surface); border-top: 1px solid var(--border);">
            <RouterLink to="/matches" class="text-xs font-bold text-blue-500 flex items-center gap-1 uppercase tracking-tighter">
              {{ t('admin.view_full_calendar') }} →
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
    <ConfirmDialog
      v-if="showConfirmDelete"
      :title="t('admin.delete_match_title') || 'Delete Match'"
      :message="t('admin.delete_match_msg') || 'Are you sure you want to permanently delete this fixture?'"
      :confirm-label="t('admin.delete') || 'DELETE'"
      :danger="true"
      :loading="submitting"
      @confirm="handleDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>

<style scoped>
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  text-indent: 1px;
  text-overflow: '';
}
/* Style for dropdown options to ensure visibility in dark mode */
option {
  background-color: var(--bg-card, #1e293b);
  color: var(--text-primary, #f8fafc);
  font-weight: 600;
}
</style>
