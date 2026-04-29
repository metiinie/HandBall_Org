<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLeagueStore } from '@/stores/league.js'
import { getTeamName } from '@/utils/teamName.js'
import { formatEthiopian, getSeasonLabel } from '@/utils/dateFormatter.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'

const { t } = useI18n()
const router = useRouter()
const league = useLeagueStore()

// State
const showConfirm = ref(false)
const showEditModal = ref(false)
const finalizing = ref(false)
const updating = ref(false)
const building = ref(false)
const error = ref('')
const success = ref('')

const showNewRoundModal = ref(false)
const newRoundData = ref({ round_number: 1, season_year: 2025 })

watch(showNewRoundModal, (isOpen) => {
  if (isOpen) {
    newRoundData.value.season_year = league.selectedSeason
    if (league.rounds.length > 0) {
      newRoundData.value.round_number = Math.max(...league.rounds.map(r => r.round_number)) + 1
    } else {
      newRoundData.value.round_number = 1
    }
  }
})

// Edit Form State
const editForm = ref({ start_date: '', end_date: '' })

async function initData() {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) {
    editForm.value.start_date = league.activeRound.start_date?.split('T')[0] || ''
    editForm.value.end_date = league.activeRound.end_date?.split('T')[0] || ''
    await Promise.all([
      league.fetchTeams(league.selectedGender),
      league.fetchMatches(league.activeRound.id),
    ])
  } else {
    // If no active round, still fetch teams for the current gender to show empty states correctly
    await league.fetchTeams(league.selectedGender)
  }
}

onMounted(initData)

// React to global filter changes
watch([() => league.selectedGender, () => league.selectedSeason], initData)

// Compact Insights
const roundLeaders = computed(() => league.standings.slice(0, 3))

const recentMatch = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Completed')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))[0]
})

const upcomingMatch = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Scheduled' || m.status === 'Pending')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))[0]
})

const completedCount = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const scheduledCount = computed(() => league.matches.filter(m => m.status === 'Scheduled' || m.status === 'Pending').length)
const allCompleted = computed(() => league.matches.length > 0 && completedCount.value === league.matches.length)
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)

async function handleUpdateRound() {
  updating.value = true
  try {
    await league.updateRound(league.activeRound.id, {
      start_date: editForm.value.start_date || null,
      end_date: editForm.value.end_date || null
    })
    success.value = 'Rounds updated.'
    showEditModal.value = false
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = e.message || 'Error.'
  } finally {
    updating.value = false
  }
}

async function handleUpdateStatus(id, newStatus) {
    updating.value = true
    error.value = ''
    try {
        if (newStatus === 'Active') {
            // setActiveRound safely deactivates the previous active round and refreshes state
            await league.setActiveRound(id)
        } else {
            await league.updateRound(id, { status: newStatus })
        }
        success.value = t('admin.status_updated') || 'Status updated.'
        setTimeout(() => success.value = '', 3000)
        // initData re-fetches everything (rounds, teams, matches) for the current active round
        await initData()
    } catch (e) {
        error.value = e.message
        setTimeout(() => error.value = '', 4000)
    } finally {
        updating.value = false
    }
}

async function doFinalizeRound() {
  finalizing.value = true
  try {
    await league.finalizeRound(league.activeRound.id)
    success.value = 'Round archived.'
    showConfirm.value = false
    await initData()
  } catch (e) {
    error.value = e.message
  } finally {
    finalizing.value = false
  }
}

async function handleCreateRound() {
    building.value = true
    try {
        await league.createRound(newRoundData.value.season_year, newRoundData.value.round_number)
        success.value = t('admin.round_created_success') || 'New round created.'
        showNewRoundModal.value = false
        setTimeout(() => success.value = '', 3000)
    } catch (e) {
        error.value = e.message
    } finally {
        building.value = false
    }
}

async function handleDeleteRound(id) {
    if (!confirm(t('admin.confirm_delete_round') || 'Are you sure you want to delete this round? All matches in this round will be lost.')) return
    const isActive = league.activeRound?.id === id
    updating.value = true
    try {
        await league.deleteRound(id)
        success.value = t('admin.round_deleted') || 'Round deleted successfully.'
        setTimeout(() => success.value = '', 3000)
        
        // If we deleted the active round, or if rounds are now empty, refresh everything
        if (isActive || league.rounds.length === 0) {
            await initData()
        }
    } catch (e) {
        error.value = e.message
    } finally {
        updating.value = false
    }
}

const statusBadge = (s) => {
  const map = {
    Active:    { dot: 'bg-emerald-500', text: t('admin.active_round', { num: '' }).split('—')[1]?.trim() || t('matches.scheduled') },
    Completed: { dot: 'bg-blue-500',    text: t('matches.history') },
    Pending:   { dot: 'bg-slate-500',   text: t('matches.draft') },
  }
  // Fallback for Status labels
  if (s === 'Active') return { dot: 'bg-emerald-500', text: t('admin.active_round', { num: '' }).replace('{num}', '').replace('—', '').trim() }
  return map[s] || map.Pending
}

const formatDate = (d) => d ? formatEthiopian(d) : 'TBA'

const today = computed(() => formatEthiopian(new Date().toISOString()))
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/admin" class="btn-icon flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </RouterLink>
        <div>
          <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">{{ t('admin.round_manager_title') }}</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ t('admin.ops_center') }}</p>
        </div>
      </div>
      <button v-if="league.activeRound" @click="showNewRoundModal = true" class="btn-ghost gap-2 px-4 py-2 uppercase tracking-widest text-[10px] font-black border border-slate-700">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ t('admin.create_round') || 'Create New Round' }}
      </button>
    </div>
    <!-- Filters -->
    <div class="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <GlobalFilter />
      <div class="hidden sm:block text-right">
        <p class="text-[13px] font-bold uppercase tracking-widest text-slate-500">{{ today }}</p>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT: Active Round (Compact Master) -->
      <div class="lg:col-span-8 space-y-4">
        
        <!-- Creation CTA (If no active round) -->
        <div v-if="!league.activeRound" class="card p-8 border-dashed border-blue-500/40 bg-blue-500/5 flex flex-col items-center text-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4"/></svg>
            </div>
            <div>
                <h3 class="text-sm font-bold">{{ t('admin.no_active_round_title') || 'No Active Round' }}</h3>
                <p class="text-xs opacity-60 mt-1">{{ t('admin.no_active_round_desc') || 'Start a new cycle to begin scheduling matches.' }}</p>
            </div>
            <button @click="showNewRoundModal = true" class="btn-primary h-10 px-8 text-[11px] font-black uppercase tracking-widest">{{ t('admin.start_new_round_btn') || 'Start New Round' }}</button>
        </div>

        <div v-if="league.activeRound" class="card overflow-hidden">
          <!-- Row 1: Status & Config -->
          <div class="px-5 py-4 border-b flex items-center justify-between bg-slate-500/5" style="border-color: var(--border);">
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs font-bold uppercase tracking-[0.15em]" style="color: var(--text-primary);">{{ t('admin.operational_round', { num: league.activeRound.round_number }) }}</span>
            </div>
            <button @click="showEditModal = true" class="text-xs font-bold uppercase text-blue-500 hover:text-blue-400">{{ t('admin.configure_dates') }}</button>
          </div>

          <!-- Row 2: Insights Grid -->
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Round Leaders (Mini) -->
            <div class="space-y-5">
              <h4 class="text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.round_leaders') }}</h4>
              <div class="space-y-2">
                <div v-for="s in roundLeaders" :key="s.team.id" class="flex items-center gap-4 p-3 rounded-2xl border bg-slate-500/5 transition-all hover:bg-slate-500/10" style="border-color: var(--border);">
                  <div class="relative">
                    <div class="w-10 h-10 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm">
                      <img v-if="s.team.logo_url" :src="s.team.logo_url" class="w-full h-full object-cover"/>
                    </div>
                    <div class="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black border border-slate-900">#{{ s.rank }}</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold truncate">{{ getTeamName(s.team) }}</p>
                    <p class="text-[13px] font-bold text-blue-500 uppercase tracking-tighter">{{ s.wins }}{{ t('standings.w') }} - {{ s.losses }}{{ t('standings.l') }}</p>
                  </div>
                  <span class="text-[12px] font-black tabular-nums opacity-60 px-2 py-1 bg-slate-900/50 rounded-lg">{{ s.leaguePts }} {{ t('standings.pts') }}</span>
                </div>
              </div>
            </div>

            <!-- Temporal & Action Feed -->
            <div class="space-y-6">
              <!-- Dates Card -->
              <div class="p-4 sm:p-5 rounded-2xl border border-dashed flex flex-col sm:flex-row items-center gap-4 sm:gap-10" style="border-color: var(--border);">
                <div class="w-full sm:flex-1 text-center sm:text-left">
                  <p class="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.start_date') }}</p>
                  <p class="text-[12px] sm:text-[14px] font-bold mt-1 tabular-nums">{{ formatDate(league.activeRound.start_date) }}</p>
                </div>
                <div class="hidden sm:block w-px h-10 bg-slate-700/50"></div>
                <div class="w-full sm:flex-1 text-center sm:text-left">
                  <p class="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.end_date') }}</p>
                  <p class="text-[12px] sm:text-[14px] font-bold mt-1 tabular-nums">{{ formatDate(league.activeRound.end_date) }}</p>
                </div>
              </div>

              <!-- Action Feed (Beautiful Cards) -->
              <div class="space-y-4">
                <div v-if="recentMatch" class="group">
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-1">{{ t('admin.latest_result') }}</p>
                  <div class="flex items-center gap-4 p-3 rounded-2xl border bg-gradient-to-r from-blue-600/10 to-transparent" style="border-color: var(--border);">
                    <span class="text-[13px] font-bold truncate flex-1 text-right">{{ getTeamName(recentMatch.home_team) }}</span>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-blue-500/30 font-black tabular-nums text-[14px] shadow-lg shadow-blue-500/10">
                      <span :class="recentMatch.home_score > recentMatch.away_score ? 'text-blue-500' : ''">{{ recentMatch.home_score }}</span>
                      <span class="opacity-20">:</span>
                      <span :class="recentMatch.away_score > recentMatch.home_score ? 'text-blue-500' : ''">{{ recentMatch.away_score }}</span>
                    </div>
                    <span class="text-[13px] font-bold truncate flex-1">{{ getTeamName(recentMatch.away_team) }}</span>
                  </div>
                </div>

                <div v-if="upcomingMatch">
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-1">{{ t('admin.on_deck') }}</p>
                  <div class="flex items-center justify-between gap-4 p-3 rounded-2xl border border-dashed hover:border-blue-500/30 transition-colors" style="border-color: var(--border);">
                    <span class="text-[13px] font-bold truncate opacity-80">{{ getTeamName(upcomingMatch.home_team) }}</span>
                    <span class="text-[9px] font-black text-slate-500 italic">VS</span>
                    <span class="text-[13px] font-bold truncate opacity-80">{{ getTeamName(upcomingMatch.away_team) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Progress & Finalise -->
          <div class="px-5 py-5 border-t bg-slate-500/5" style="border-color: var(--border);">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div class="flex-1 w-full space-y-3">
                <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest opacity-70">
                  <span>{{ t('admin.sync_status') }}</span>
                  <span>{{ progressPct }}%</span>
                </div>
                <div class="h-2 rounded-full overflow-hidden bg-slate-900/40">
                  <div :style="`width: ${progressPct}%`" :class="['h-full transition-all duration-700', allCompleted ? 'bg-emerald-500' : 'bg-blue-600']"></div>
                </div>
              </div>
              <button @click="showConfirm = true" :disabled="!league.matches.length" 
                class="btn-primary w-full sm:w-auto h-11 px-8 text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-600/20">
                {{ t('admin.finalize_round') }}
              </button>
            </div>
          </div>
        </div>

        <!-- No Active State -->
        <div v-else class="card p-12 flex flex-col items-center text-center gap-3">
          <p class="text-sm font-bold opacity-20 uppercase">{{ t('admin.no_active_ops') }}</p>
          <p class="text-xs opacity-50">{{ t('admin.dormant_state') }}</p>
        </div>
      </div>

      <!-- RIGHT: Archive Rail (Side rail) -->
      <div class="lg:col-span-4 space-y-4">
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b bg-slate-500/5" style="border-color: var(--border);">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-50">{{ t('admin.season_archive') }}</span>
          </div>
          <div class="p-2 space-y-1 max-h-[500px] overflow-y-auto">
            <div v-for="r in league.rounds" :key="r.id"
              class="p-3 rounded-lg border border-transparent hover:bg-slate-500/5 transition-colors"
              :class="r.status === 'Active' ? 'border-blue-500/20 bg-blue-500/5' : ''">

              <!-- Round header row -->
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xs tabular-nums text-blue-500 flex-shrink-0">
                  {{ r.round_number }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold leading-none">{{ t('matches.round', { num: r.round_number }) }}</p>
                  <p class="text-[9px] mt-1 opacity-50">{{ getSeasonLabel(r.season_year) }} {{ t('global.season') }}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <div :class="['w-1.5 h-1.5 rounded-full', statusBadge(r.status).dot]"></div>
                  <span class="text-[8px] font-bold uppercase opacity-60">{{ r.status }}</span>
                </div>
              </div>

              <!-- Status Manager Row -->
              <div class="flex items-center gap-1.5 pl-11">
                <button
                  v-if="r.status !== 'Active'"
                  @click="handleUpdateStatus(r.id, 'Active')"
                  :disabled="updating"
                  class="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  ✓ {{ t('admin.activate') || 'Set Active' }}
                </button>
                <span
                  v-else
                  class="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase tracking-widest"
                >
                  ● {{ t('global.active') }}
                </span>

                <button
                  v-if="r.status === 'Active' || r.status === 'Completed'"
                  @click="handleUpdateStatus(r.id, 'Pending')"
                  :disabled="updating"
                  class="text-[9px] font-black px-2 py-1 rounded-md bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20 uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  ↩ {{ t('matches.draft') }}
                </button>

                <button
                  v-if="r.status !== 'Completed'"
                  @click="handleUpdateStatus(r.id, 'Completed')"
                  :disabled="updating"
                  class="text-[9px] font-black px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  ✓ {{ t('matches.completed') }}
                </button>

                <button
                  @click="handleDeleteRound(r.id)"
                  :disabled="updating"
                  class="text-[9px] font-black px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  ✕ {{ t('admin.delete') }}
                </button>
              </div>
            </div>
            <div v-if="!league.rounds.length" class="p-8 text-center text-xs opacity-30">Archive empty.</div>
          </div>
        </div>

        <!-- Feedback Toast -->
        <transition name="fade">
          <div v-if="success || error" class="card px-4 py-3 text-xs font-semibold rounded-xl"
            :class="success ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'">
            {{ success || error }}
          </div>
        </transition>
      </div>

    </div>

    <!-- Modals (Dates) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80">
        <div class="card w-full max-w-sm overflow-hidden border-blue-500/30">
          <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border);">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">{{ t('admin.round_config') }}</h2>
            <button @click="showEditModal = false" class="btn-icon"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.start_date') }}</label>
                <input v-model="editForm.start_date" type="date" class="input-field h-11 text-sm px-3"/>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.end_date') }}</label>
                <input v-model="editForm.end_date" type="date" class="input-field h-11 text-sm px-3"/>
              </div>
            </div>
            <button @click="handleUpdateRound" :disabled="updating" class="btn-primary w-full h-11 text-xs font-black uppercase tracking-widest">{{ t('admin.sync_changes') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- New Round Modal -->
    <Teleport to="body">
      <div v-if="showNewRoundModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80">
        <div class="card w-full max-w-sm overflow-hidden border-emerald-500/30">
          <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border);">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">{{ t('admin.create_new_round_title') || 'Start New Round' }}</h2>
            <button @click="showNewRoundModal = false" class="btn-icon"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('admin.round_number') || 'Round #' }}</label>
                <input v-model.number="newRoundData.round_number" type="number" class="input-field h-11 text-sm px-3"/>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">{{ t('global.season') }}</label>
                <input :value="getSeasonLabel(newRoundData.season_year)" type="text" class="input-field h-11 text-sm px-3" disabled/>
              </div>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-tight" style="color: var(--text-muted);">{{ t('admin.new_round_warn') || 'Matches from previous rounds will be archived.' }}</p>
            <button @click="handleCreateRound" :disabled="building" class="btn-primary w-full h-11 text-xs font-black uppercase tracking-widest" style="background-color: #10b981; border-color: #059669;">
              {{ building ? (t('admin.initializing') || 'Initializing…') : (t('admin.initialize_round') || 'Start Round') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Finalise Dialog -->
    <ConfirmDialog 
      v-if="showConfirm" 
      :title="t('admin.finalize_title')" 
      :message="t('admin.finalize_msg')" 
      :confirm-label="t('admin.finalize_round').split(' ')[0].toUpperCase()" 
      :loading="finalizing" 
      @confirm="doFinalizeRound" 
      @cancel="showConfirm = false" />
  </div>
</template>
