<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLeagueStore } from '@/stores/league.js'
import { getTeamName } from '@/utils/teamName.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import TeamLogo from '@/components/TeamLogo.vue'

const { t } = useI18n()
const router = useRouter()
const league = useLeagueStore()

const genderTab = ref('ወንድ')
const editTarget = ref(null)
const deleteTarget = ref(null)
const formLoading = ref(false)
const deleteLoading = ref(false)
const formError = ref('')
const formSuccess = ref('')
const showForm = ref(false)

const form = ref({ name: '', gender: 'ወንድ', logo_url: '' })

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === league.selectedGender)
)

const menCount = computed(() => league.teams.filter(t => t.gender === 'ወንድ').length)
const womenCount = computed(() => league.teams.filter(t => t.gender === 'ሴት').length)

onMounted(() => league.fetchTeams())

function startAdd() {
  editTarget.value = null
  form.value = { name: '', gender: genderTab.value, logo_url: '' }
  formError.value = ''
  formSuccess.value = ''
  showForm.value = true
}

function startEdit(team) {
  editTarget.value = team
  form.value = { name: team.name, gender: team.gender, logo_url: team.logo_url || '' }
  formError.value = ''
  formSuccess.value = ''
  showForm.value = true
}

function cancelForm() {
  editTarget.value = null
  showForm.value = false
  form.value = { name: '', gender: genderTab.value, logo_url: '' }
  formError.value = ''
}

async function handleSubmit() {
  if (!form.value.name.trim()) { formError.value = t('admin.team_name_req'); return }
  formLoading.value = true
  formError.value = ''
  formSuccess.value = ''
  try {
    if (editTarget.value) {
      await league.updateTeam(editTarget.value.id, {
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
      formSuccess.value = t('admin.team_updated')
    } else {
      await league.createTeam({
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
      formSuccess.value = t('admin.team_added')
    }
    cancelForm()
    await league.fetchTeams()
    setTimeout(() => formSuccess.value = '', 3000)
  } catch (e) {
    formError.value = e.message || t('admin.failed_save')
  } finally {
    formLoading.value = false
  }
}

async function handleDelete() {
  deleteLoading.value = true
  try {
    await league.deleteTeam(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e) {
    formError.value = e.message
  } finally {
    deleteLoading.value = false
  }
}

</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div class="flex items-center gap-3">
        <RouterLink to="/admin" class="btn-icon mt-0.5 flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </RouterLink>
        <div>
          <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">{{ t('admin.team_manager_title') }}</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ t('admin.team_manager_desc') }}</p>
        </div>
      </div>

      <button @click="startAdd" class="btn-primary gap-2 px-4 py-2 uppercase tracking-widest text-[10px] font-black">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ t('admin.add_team') }}
      </button>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--bg-surface);">
          <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-lg font-bold leading-none tabular-nums" style="color: var(--text-primary);">{{ league.teams.length }}</p>
          <p class="text-[10px] uppercase tracking-wider mt-1" style="color: var(--text-muted);">{{ t('admin.total_teams') }}</p>
        </div>
      </div>
      <div class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--bg-surface);">
          <span class="text-base font-bold text-blue-500">♂</span>
        </div>
        <div>
          <p class="text-lg font-bold leading-none tabular-nums" style="color: var(--text-primary);">{{ menCount }}</p>
          <p class="text-[10px] uppercase tracking-wider mt-1" style="color: var(--text-muted);">{{ t('admin.mens_division') }}</p>
        </div>
      </div>
      <div class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: var(--bg-surface);">
          <span class="text-base font-bold text-pink-500">♀</span>
        </div>
        <div>
          <p class="text-lg font-bold leading-none tabular-nums" style="color: var(--text-primary);">{{ womenCount }}</p>
          <p class="text-[10px] uppercase tracking-wider mt-1" style="color: var(--text-muted);">{{ t('admin.womens_division') }}</p>
        </div>
      </div>
    </div>

    <!-- Form Drawer -->
    <Transition name="slide-form">
      <div v-if="showForm" class="mb-8">
        <div class="card p-6 border-blue-500/30 shadow-2xl shadow-blue-600/10" style="background-color: var(--bg-surface);">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">
              {{ editTarget ? t('admin.edit_team', { name: getTeamName(editTarget) }) : t('admin.add_new_team') }}
            </h2>
            <button @click="cancelForm" class="btn-icon">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div class="md:col-span-5">
              <label class="block text-[10px] font-bold uppercase tracking-wider mb-2" style="color: var(--text-muted);">{{ t('admin.team_name') }}</label>
              <input v-model="form.name" type="text" required class="input-field" placeholder="Enter name…"/>
            </div>
            <div class="md:col-span-3">
              <label class="block text-[10px] font-bold uppercase tracking-wider mb-2" style="color: var(--text-muted);">{{ t('admin.division_label') }}</label>
              <div class="flex gap-2">
                <button v-for="g in ['ወንድ', 'ሴት']" :key="g"
                  type="button"
                  @click="form.gender = g"
                  :class="['flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    form.gender === g ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' : '']"
                  :style="form.gender !== g ? 'color: var(--text-secondary); background-color: var(--bg-card); border-color: var(--border);' : ''"
                >{{ g === 'ወንድ' ? t('gender.men') : t('gender.women') }}</button>
              </div>
            </div>
            <div class="md:col-span-4">
              <label class="block text-[10px] font-bold uppercase tracking-wider mb-2" style="color: var(--text-muted);">{{ t('admin.logo_url') }}</label>
              <input v-model="form.logo_url" type="url" class="input-field" placeholder="https://…"/>
            </div>
            <div class="md:col-span-12 flex justify-end gap-3 mt-2">
              <button type="button" @click="cancelForm" class="btn-ghost">{{ t('admin.cancel') || 'Cancel' }}</button>
              <button type="submit" :disabled="formLoading" class="btn-primary min-w-[120px] h-10 text-[11px] font-black uppercase tracking-widest">
                {{ formLoading ? t('admin.saving') : (editTarget ? t('admin.update') || 'Update' : t('admin.add_team')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Global Filter & List -->
    <div class="card overflow-hidden">
      <div class="p-4 border-b" style="border-color: var(--border); background-color: var(--bg-surface);">
        <GlobalFilter />
      </div>

      <!-- List -->
      <div class="divide-y" style="border-color: var(--border);">
        <div v-for="(team, index) in filteredTeams" :key="team.id"
          class="flex items-center px-6 py-4 hover:bg-slate-500/5 transition-colors group">
          <span class="w-8 text-xs font-bold mr-4 opacity-30 tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>
          
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <TeamLogo :team="team" size="w-10 h-10" rounded="rounded-full" class="transition-transform group-hover:scale-110" />
            <div class="min-w-0">
              <p class="text-sm font-bold truncate" style="color: var(--text-primary);">{{ getTeamName(team) }}</p>
              <p class="text-[10px] uppercase font-bold tracking-wider mt-0.5" style="color: var(--text-muted);">{{ t('admin.active_member') }}</p>
            </div>
          </div>

          <div class="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-2 sm:group-hover:translate-x-0">
            <button @click="startEdit(team)" class="btn-sm btn-ghost px-2 sm:px-3 text-[10px] sm:text-xs">{{ t('admin.edit') || 'Edit' }}</button>
            <button @click="deleteTarget = team" class="btn-sm btn-danger opacity-80 hover:opacity-100 px-2 sm:px-3 text-[10px] sm:text-xs">{{ t('admin.remove') }}</button>
          </div>
        </div>

        <div v-if="!league.loading && filteredTeams.length === 0" class="py-20 text-center">
          <p class="text-sm font-medium" style="color: var(--text-muted);">{{ t('admin.no_teams_div') }}</p>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="deleteTarget"
      :title="t('admin.remove_team_title')"
      :message="t('admin.remove_team_msg', { name: getTeamName(deleteTarget) })"
      :confirm-label="t('admin.remove').toUpperCase()"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
