<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { exportStandingsImage } from '@/utils/exportImage.js'
import { getTeamName } from '@/utils/teamName.js'
import TeamLogo from '@/components/TeamLogo.vue'

const props = defineProps({
  standings:   { type: Array,            default: () => [] },
  loading:     { type: Boolean,          default: false },
  roundLabel:  { type: String,           default: 'Round' },
  gender:      { type: String,           default: '' },
  seasonYear:  { type: [String, Number], default: '' },
  showExports: { type: Boolean,          default: true },
  isGlobal:    { type: Boolean,          default: false },
  cumulative:  { type: Boolean,          default: false },
})

const emit = defineEmits(['update:cumulative'])

const { t } = useI18n()
const shareSuccess = ref(false)
const activeTeamId = ref(null)
const isExporting = ref(false)

function toggleTooltip(id) {
  if (activeTeamId.value === id) {
    activeTeamId.value = null
  } else {
    activeTeamId.value = id
    setTimeout(() => {
      if (activeTeamId.value === id) activeTeamId.value = null
    }, 4000) // auto-hide after 4 seconds
  }
}

const standingsWithTie = computed(() => {
  return props.standings.map((entry, i, arr) => {
    const prev = arr[i - 1]
    const next = arr[i + 1]
    const tied = (prev && prev.leaguePts === entry.leaguePts)
              || (next && next.leaguePts === entry.leaguePts)
    return { ...entry, isTied: tied }
  })
})

const localizedGender = computed(() => {
  if (props.gender === 'ወንድ') return t('gender.men')
  if (props.gender === 'ሴት')  return t('gender.women')
  return props.gender
})

async function handleShare() {
  const shareData = {
    title: `EHF League Standings - ${props.roundLabel}`,
    text: `Check out the standings for the EHF ${props.seasonYear} season - ${localizedGender.value} Division!`,
    url: window.location.href,
  }
  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      shareSuccess.value = true
      setTimeout(() => shareSuccess.value = false, 3000)
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Share failed:', err)
  }
}

async function handleExportImage() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    await exportStandingsImage(
      'standings-social-card',
      `EHF_${props.roundLabel.replace(/\s+/g, '_')}_${props.seasonYear}.png`
    )
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="w-full">

    <!-- Header Context & Export Controls -->
    <div v-if="showExports && standings.length > 0" class="flex items-center justify-between mb-3">
      
      <!-- Cumulative Toggle -->
      <label v-if="!isGlobal" class="flex items-center gap-2 cursor-pointer">
        <div class="relative flex items-center">
          <input type="checkbox" class="sr-only" :checked="cumulative" @change="$emit('update:cumulative', $event.target.checked)">
          <div class="block w-9 h-5 rounded-full transition-colors" :class="cumulative ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'"></div>
          <div class="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform" :class="{'translate-x-4': cumulative}"></div>
        </div>
        <span class="text-[11px] font-bold uppercase tracking-widest" style="color: var(--text-secondary);">
          {{ cumulative ? t('standings.combined') : t('standings.round_only') }}
        </span>
      </label>
      <div v-else></div>

      <!-- Export Buttons -->
      <div class="flex justify-end gap-2">
        <button @click="handleExportImage"
          :disabled="isExporting"
          class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all btn-ghost uppercase tracking-widest disabled:opacity-50">
          <svg v-if="!isExporting" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isExporting ? t('admin.saving') || 'PNG...' : 'PNG' }}
        </button>
        <button @click="handleShare"
          class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 transition-all uppercase tracking-widest">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          {{ shareSuccess ? t('admin.saved') : t('global.share') }}
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i"
        class="h-14 rounded-xl animate-pulse"
        :style="`background-color: var(--bg-surface); opacity: ${1 - i * 0.1}`"/>
    </div>

    <!-- Standings Table -->
    <div v-else-if="standings.length > 0" id="standings-social-card"
      class="card rounded-2xl overflow-hidden">

      <!-- Header -->
      <div class="px-4 py-4 flex items-center justify-between" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-200/50">
            <img src="/logos/ehf.png" alt="EHF Logo" class="w-full h-full object-contain p-1" />
          </div>
          <div>
            <div class="text-sm font-bold leading-none" style="color: var(--text-primary);">{{ t('global.league') }}</div>
            <div class="text-xs mt-1 leading-none uppercase tracking-widest font-black opacity-60" style="color: var(--text-muted);">{{ localizedGender }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-blue-500">{{ roundLabel }}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted);">{{ t('global.season') }} {{ seasonYear }}</div>
        </div>
      </div>

      <!-- Column Legend -->
      <div class="standings-row standings-header" style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border);">
        <div class="col-rank" style="color: var(--text-muted);" :title="t('standings.tooltips.rank')">{{ t('standings.pos') }}</div>
        <div class="col-team" style="color: var(--text-muted);">{{ t('standings.team') }}</div>
        <div class="col-stat" style="color: var(--text-muted);" :title="t('standings.tooltips.games_played')">{{ t('standings.gp') }}</div>
        <div class="col-stat" style="color: var(--text-muted);" :title="t('standings.tooltips.wins')">{{ t('standings.w') }}</div>
        <div class="col-stat" style="color: var(--text-muted);" :title="t('standings.tooltips.losses')">{{ t('standings.l') }}</div>
        <div class="col-stat" style="color: var(--text-muted);" :title="t('standings.tooltips.draws')">{{ t('standings.d') }}</div>
        <div class="col-stat col-wide" style="color: var(--text-muted);" :title="t('standings.tooltips.points_for')">{{ t('standings.pf') }}</div>
        <div class="col-stat col-wide" style="color: var(--text-muted);" :title="t('standings.tooltips.points_against')">{{ t('standings.pa') }}</div>
        <div class="col-stat" style="color: var(--text-muted);" :title="t('standings.tooltips.point_difference')">{{ t('standings.pd') }}</div>
        <div class="col-pts" style="color: var(--text-muted);" :title="t('standings.tooltips.league_points')">{{ t('standings.pts') }}</div>
      </div>

      <!-- Rows -->
      <TransitionGroup name="standing-row" tag="div">
        <div
          v-for="(entry, index) in standingsWithTie"
          :key="entry.team.id"
          class="standings-row standings-data-row group"
          style="border-bottom: 1px solid var(--border);"
        >
          <!-- Rank -->
          <div class="col-rank">
            <span class="rank-badge" :class="index < 3 ? 'rank-top' : 'rank-normal'">
              {{ index + 1 }}
            </span>
          </div>

          <!-- Team -->
          <div class="col-team" @click="toggleTooltip(entry.team.id)" style="cursor: pointer; position: relative;">
            <TeamLogo :team="entry.team" size="w-7 h-7" rounded="rounded-lg" />
            <div class="team-info">
              <span class="team-name" style="color: var(--text-primary);" :title="getTeamName(entry.team)">{{ getTeamName(entry.team) }}</span>
            </div>

            <!-- Mobile Tap Tooltip -->
            <Transition name="fade">
              <div v-if="activeTeamId === entry.team.id" class="mobile-tap-tooltip lg:hidden">
                {{ getTeamName(entry.team) }}
                <div class="tooltip-arrow"></div>
              </div>
            </Transition>
          </div>

          <!-- GP -->
          <div class="col-stat" style="color: var(--text-primary);">{{ (entry.wins ?? 0) + (entry.draws ?? 0) + (entry.losses ?? 0) }}</div>

          <!-- W -->
          <div class="col-stat font-black" style="color: var(--text-primary);">{{ entry.wins }}</div>

          <!-- L -->
          <div class="col-stat" style="color: var(--text-secondary);">{{ entry.losses }}</div>
          
          <!-- D -->
          <div class="col-stat" style="color: var(--text-secondary);">{{ entry.draws ?? 0 }}</div>

          <!-- PF -->
          <div class="col-stat col-wide" style="color: var(--text-secondary);">{{ entry.ptsFor }}</div>

          <!-- PA -->
          <div class="col-stat col-wide" style="color: var(--text-secondary);">{{ entry.ptsAgainst }}</div>

          <!-- PD -->
          <div class="col-stat font-black"
            :style="entry.ptsDiff > 0 ? 'color:#10b981' : entry.ptsDiff < 0 ? 'color:#f43f5e' : 'color:var(--text-secondary)'">
            {{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }}
          </div>

          <!-- League PTS -->
          <div class="col-pts">
            <span class="pts-badge">{{ entry.leaguePts }}</span>
          </div>
        </div>
      </TransitionGroup>

      <!-- Champion Banner -->
      <div v-if="isGlobal && standings.length > 0"
        class="px-4 py-3 flex items-center gap-3 bg-amber-500/10 border-t border-amber-500/20">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="text-sm font-bold text-amber-400 overflow-hidden truncate">
          {{ t('standings.champion') }}: <span style="color: var(--text-primary);">{{ getTeamName(standings[0]?.team) }}</span>
        </span>
        <span class="ml-auto text-xs whitespace-nowrap" style="color: var(--text-muted);">{{ standings[0]?.leaguePts }} {{ t('standings.pts').toLowerCase() }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card p-14 flex flex-col items-center text-center gap-4 rounded-2xl">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: var(--bg-surface);">
        <svg class="w-6 h-6" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <div>
        <p class="font-semibold" style="color: var(--text-secondary);">{{ t('admin.no_standings') }}</p>
        <p class="text-sm mt-1" style="color: var(--text-muted);">{{ t('matches.check_back') }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Responsive standings grid ──────────────────────────────────────────── */
/*
  Columns: # | Team | GP | W | L | PF | PA | PD | PTS
  On mobile: PF and PA are hidden (col-wide) to save space
  Everything is visible without horizontal scrolling
*/

.standings-row {
  display: grid;
  grid-template-columns:
    32px          /* rank  */
    1fr           /* team  */
    32px          /* GP    */
    32px          /* W     */
    32px          /* L     */
    32px          /* D     */
    40px          /* PF    */
    40px          /* PA    */
    40px          /* PD    */
    48px;         /* PTS   */
  align-items: center;
  width: 100%;
  min-width: 0;
}

/* Adjust column widths for small screens to ensure all columns fit */
@media (max-width: 480px) {
  .standings-row {
    grid-template-columns:
      16px   /* rank */
      minmax(60px, 1fr) /* team */
      20px   /* GP   */
      20px   /* W    */
      20px   /* L    */
      20px   /* D    */
      26px   /* PF   */
      26px   /* PA   */
      28px   /* PD   */
      28px;  /* PTS  */
  }
  
  .standings-data-row {
    padding: 8px 4px;
  }
  
  .standings-header {
    padding: 8px 4px;
  }
  
  .col-stat,
  .col-wide {
    font-size: 10px;
    padding: 0 1px;
  }

  .col-pts {
    font-size: 12px;
  }
  
  .pts-badge {
    font-size: 12px;
  }
  
  .col-team {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding-right: 2px;
  }

  .team-info {
    align-items: center;
    width: 100%;
  }

  .team-name {
    font-size: 8px;
    font-weight: 500;
    text-align: center;
    white-space: normal;
    word-break: break-word; /* Let the browser natively break big words to the next line */
    width: 100%; /* Force use of full available width */
    line-height: 1.1;
    margin-top: 3px;
  }
}

/* ── Header row ── */
.standings-header {
  padding: 8px 12px;
}

.standings-header .col-rank,
.standings-header .col-stat,
.standings-header .col-wide,
.standings-header .col-pts {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

.standings-header .col-team {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-left: 4px;
}

/* ── Data row ── */
.standings-data-row {
  padding: 10px 12px;
  transition: background-color 0.15s;
}

.standings-data-row:hover {
  background-color: rgba(148, 163, 184, 0.04);
}

/* ── Shared column styles ── */
.col-rank {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.col-team {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-right: 4px;
}

.col-stat,
.col-wide {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.col-pts {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ── Rank badge ── */
.rank-badge {
  font-size: 12px;
  font-weight: 900;
  font-style: italic;
}

.rank-top {
  color: #f59e0b;
}

.rank-normal {
  color: var(--text-muted);
}

/* ── Team info ── */
.team-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.team-name {
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.tie-badge {
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #3b82f6;
  margin-top: 2px;
}

/* ── League PTS pill ── */
.pts-badge {
  font-size: 14px;
  font-weight: 900;
  color: #3b82f6;
  font-variant-numeric: tabular-nums;
}

/* ── Row transition ── */
.standing-row-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* ── Form Pills ── */
.col-form-hdr {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

.col-form {
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-pills {
  display: flex;
  gap: 3px;
  align-items: center;
}

.pill {
  width: 5px;
  height: 12px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.pill-w {
  background-color: #10b981; /* emerald-500 */
}

.pill-d {
  background-color: #f59e0b; /* amber-500 */
}

.pill-l {
  background-color: #f43f5e; /* rose-500 */
}

@media (max-width: 480px) {
  .col-form-hdr {
    font-size: 10px;
  }
  .form-pills {
    gap: 2px;
  }
  .pill {
    width: 4px;
    height: 10px;
  }
}

/* ── Mobile Tap Tooltip ── */
.mobile-tap-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-card);
  color: var(--text-primary);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 60;
  pointer-events: none;
  border: 1px solid var(--border);
  margin-bottom: 8px;
}

.tooltip-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(5px) scale(0.95);
}
</style>
