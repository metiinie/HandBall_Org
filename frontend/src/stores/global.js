import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api.js'

export const useGlobalStore = defineStore('global', () => {
  const snapshots = ref([])
  const globalStandings = ref([])
  const seasonYears = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchGlobalStandings(gender = 'ወንድ', seasonYear = 2025) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/standings/cumulative?gender=${gender}&season_year=${seasonYear}`)
      globalStandings.value = data || []
      
      // Also fetch snapshots for reference if needed
      const snapUrl = seasonYear ? `/snapshots?season_year=${seasonYear}` : '/snapshots'
      const snapRes = await api.get(snapUrl)
      snapshots.value = snapRes.data || []
      
      const years = [...new Set(snapshots.value.map(s => s.season_year).filter(Boolean))]
      seasonYears.value = years.sort((a, b) => b - a)
    } catch (e) {
      error.value = e.message || 'Failed to fetch global standings'
    } finally {
      loading.value = false
    }
  }

  return { snapshots, globalStandings, seasonYears, loading, error, fetchGlobalStandings }
})
