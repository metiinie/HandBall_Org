<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeagueStore } from '@/stores/league.js'
import { getTeamName } from '@/utils/teamName.js'
import TeamLogo from '@/components/TeamLogo.vue'

const { t } = useI18n()
const league = useLeagueStore()
const props = defineProps({ match: { type: Object, default: null } })
const emit = defineEmits(['save', 'close'])

const homeScore = ref(0)
const awayScore = ref(0)
const isOT = ref(false)
const saving = ref(false)
const error = ref('')

watch(() => props.match, (m) => {
  if (m) {
    homeScore.value = m.home_score ?? 0
    awayScore.value = m.away_score ?? 0
    isOT.value = m.is_ot ?? false
    error.value = ''
  }
}, { immediate: true })

function increaseHome() { homeScore.value = parseInt(homeScore.value || 0) + 1 }
function decreaseHome() { homeScore.value = Math.max(0, parseInt(homeScore.value || 0) - 1) }
function increaseAway() { awayScore.value = parseInt(awayScore.value || 0) + 1 }
function decreaseAway() { awayScore.value = Math.max(0, parseInt(awayScore.value || 0) - 1) }

function validate() {
  const h = parseInt(homeScore.value), a = parseInt(awayScore.value)
  if (isNaN(h) || isNaN(a)) return t('admin.scores_req')
  if (h < 0 || a < 0) return t('admin.neg_scores_err')
  return ''
}

async function handleSave() {
  const vErr = validate()
  if (vErr) { error.value = vErr; return }
  saving.value = true
  try {
    await emit('save', {
      matchId: props.match.id,
      homeScore: parseInt(homeScore.value),
      awayScore: parseInt(awayScore.value),
      isOT: isOT.value
    })
  } finally {
    saving.value = false
  }
}

async function handleForfeit(side) {
  if (!confirm(t('admin.confirm_forfeit_msg'))) return
  saving.value = true
  try {
    await league.markMatchForfeit(props.match.id, side)
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <Teleport to="body">
    <div v-if="match"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style="background-color: rgba(15,23,42,0.75);"
      @click.self="emit('close')"
    >
      <!-- Smaller, Compact Container -->
      <div class="card w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] animate-slide-up flex flex-col overflow-hidden">
        
        <!-- Compact Header -->
        <div class="px-5 py-3.5 flex items-center justify-between border-b" style="border-color: var(--border);">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">{{ t('admin.log_official_score') }}</h2>
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">• {{ match.venue || t('admin.neutral_venue') }}</span>
          </div>
          <button @click="emit('close')" class="btn-icon w-8 h-8">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-4 sm:p-6 overflow-y-auto flex-1">
          <div class="flex flex-col md:flex-row items-center gap-6 justify-between">
            
            <!-- Home Team -->
            <div class="flex-1 w-full flex flex-col items-center gap-3">
              <TeamLogo :team="match.home_team" size="w-12 h-12 sm:w-16 sm:h-16" rounded="rounded-xl" />
              <h3 class="text-sm font-bold text-center leading-tight h-8 flex items-center" style="color: var(--text-heading);">{{ getTeamName(match.home_team) }}</h3>
              
              <div class="w-full space-y-3">
                <input v-model="homeScore" type="number" 
                  class="w-full rounded-lg text-center text-4xl font-bold py-3 outline-none transition-all tabular-nums"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-1.5">
                  <button @click="decreaseHome" class="flex-1 btn-ghost py-2 text-lg">−</button>
                  <button @click="increaseHome" class="flex-1 btn-primary py-2 text-lg">+</button>
                </div>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="flex flex-col items-center gap-1 opacity-20">
              <span class="text-[10px] font-bold italic tracking-widest px-4">VS</span>
            </div>

            <!-- Away Team -->
            <div class="flex-1 w-full flex flex-col items-center gap-3">
              <TeamLogo :team="match.away_team" size="w-12 h-12 sm:w-16 sm:h-16" rounded="rounded-xl" />
              <h3 class="text-sm font-bold text-center leading-tight h-8 flex items-center" style="color: var(--text-heading);">{{ getTeamName(match.away_team) }}</h3>
              
              <div class="w-full space-y-3">
                <input v-model="awayScore" type="number" 
                  class="w-full rounded-lg text-center text-4xl font-bold py-3 outline-none transition-all tabular-nums"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-1.5">
                  <button @click="decreaseAway" class="flex-1 btn-ghost py-2 text-lg">−</button>
                  <button @click="increaseAway" class="flex-1 btn-primary py-2 text-lg">+</button>
                </div>
              </div>
            </div>

          </div>

          <!-- Extra Controls: OT & Forfeits -->
          <div class="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- OT Toggle -->
            <div class="flex items-center justify-between p-3 rounded-xl border bg-slate-500/5" style="border-color: var(--border);">
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-primary);">Extra Time (ET)</span>
                <span class="text-[9px] font-medium opacity-50">{{ t('admin.ot_desc') || 'Check if game ended in Extra Time' }}</span>
              </div>
              <button @click="isOT = !isOT" 
                class="w-10 h-5 rounded-full relative transition-all duration-300"
                :class="isOT ? 'bg-blue-600' : 'bg-slate-700'"
              >
                <div class="absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300"
                  :style="`left: ${isOT ? '24px' : '4px'}`"></div>
              </button>
            </div>

            <!-- Forfeit Actions -->
            <div class="flex items-center gap-2">
              <button @click="handleForfeit('home')" class="flex-1 py-3 px-2 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tight transition-all">
                {{ t('admin.forfeit_home') || 'Forfeit Home' }}
              </button>
              <button @click="handleForfeit('away')" class="flex-1 py-3 px-2 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tight transition-all">
                {{ t('admin.forfeit_away') || 'Forfeit Away' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Compact Footer (Fixed at bottom) -->
        <div class="px-4 sm:px-5 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0" 
             style="background-color: var(--bg-surface); border-color: var(--border);">
          <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{{ t('admin.auth_verification_req') }}</span>
          <div class="flex items-center gap-2 w-full md:w-auto">
            <button @click="emit('close')" class="flex-1 md:flex-none btn-ghost text-xs px-5 py-2 uppercase tracking-widest font-bold">{{ t('admin.cancel') }}</button>
            <button @click="handleSave" :disabled="saving" class="flex-1 md:flex-none btn-primary text-xs px-6 py-2 uppercase tracking-widest font-black">
              {{ saving ? t('admin.syncing') : t('admin.confirm_score') }}
            </button>
          </div>
        </div>
        
        <p v-if="error" class="bg-red-500 text-white text-[10px] font-bold py-1 px-4 text-center uppercase tracking-widest">{{ error }}</p>

      </div>
    </div>
  </Teleport>
</template>


<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>
