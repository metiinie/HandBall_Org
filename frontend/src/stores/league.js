import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api.js'
import { calculateStandings } from '@/utils/standings.js'
import { getErrorMessage } from '@/utils/errorMapper.js'
import { useAuthStore } from '@/stores/auth.js'

export const useLeagueStore = defineStore('league', () => {
  const teams = ref([])
  const rounds = ref([])
  const activeRound = ref(null)
  const matches = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Global Context Filters (League-style)
  const selectedGender = ref('ወንድ')
  const selectedSeason = ref(2025)

  /** Reactive standings computed from current round matches + teams */
  const standings = computed(() => {
    if (!teams.value.length) return []
    return calculateStandings(matches.value, teams.value)
  })

  let matchEventSource = null

  // ─── Teams ───────────────────────────────────────────────────────────────

  async function fetchTeams(gender = null) {
    loading.value = true
    error.value = null
    try {
      const url = gender ? `/teams?gender=${gender}` : '/teams'
      const { data } = await api.get(url)
      teams.value = data || []
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  async function createTeam(payload) {
    const { data } = await api.post('/teams', payload)
    teams.value.push(data)
    logAuditAction('CREATE_TEAM', data.id, payload)
    return data
  }

  async function updateTeam(id, payload) {
    const targetIdx = teams.value.findIndex(t => t.id === id)
    if (targetIdx === -1) return null
    const originalTeam = { ...teams.value[targetIdx] }
    
    // Optimistic Update
    teams.value[targetIdx] = { ...originalTeam, ...payload }

    try {
      const { data } = await api.patch(`/teams/${id}`, payload)
      const idx = teams.value.findIndex(t => t.id === id)
      if (idx !== -1) teams.value[idx] = data
      
      logAuditAction('UPDATE_TEAM', id, payload)
      return data
    } catch (err) {
      const idx = teams.value.findIndex(t => t.id === id)
      if (idx !== -1) teams.value[idx] = originalTeam
      throw err
    }
  }

  async function deleteTeam(id) {
    await api.delete(`/teams/${id}`)
    teams.value = teams.value.filter(t => t.id !== id)
    logAuditAction('DELETE_TEAM', id, { team_id: id })
  }

  // ─── Rounds ──────────────────────────────────────────────────────────────

  async function fetchRounds(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      let url = `/rounds?gender=${selectedGender.value}`
      if (seasonYear) url += `&season_year=${seasonYear}`
      
      const { data } = await api.get(url)
      rounds.value = data || []
      activeRound.value = data?.find(r => r.status === 'Active') ?? null
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  async function updateRound(id, payload) {
    const { data } = await api.patch(`/rounds/${id}`, payload)
    const idx = rounds.value.findIndex(r => r.id === id)
    if (idx !== -1) rounds.value[idx] = data
    if (activeRound.value?.id === id) activeRound.value = data
    logAuditAction('UPDATE_ROUND', id, payload)
    return data
  }

  async function createRound(seasonYear, roundNumber) {
    const { data } = await api.post('/rounds', {
      season_year: seasonYear,
      round_number: roundNumber,
      gender: selectedGender.value,
      status: 'Pending'
    })
    rounds.value.push(data)
    logAuditAction('CREATE_ROUND', data.id, data)
    return data
  }

  async function setActiveRound(roundId) {
    loading.value = true
    try {
      const { data } = await api.post(`/rounds/${roundId}/activate`)
      logAuditAction('SET_ACTIVE_ROUND', roundId, { })
      
      // Refresh rounds state
      await fetchRounds(data.season_year)
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ─── Matches ─────────────────────────────────────────────────────────────

  async function createMatch(payload) {
    const { data } = await api.post('/matches', payload)
    if (matches.value.length > 0 && matches.value[0].round_id === data.round_id) {
       matches.value.push(data)
    }
    logAuditAction('CREATE_MATCH', data.id, payload)
    return data
  }

  async function updateMatch(id, payload) {
    const targetIdx = matches.value.findIndex(m => m.id === id)
    if (targetIdx === -1) return null
    const originalMatch = { ...matches.value[targetIdx] }
    
    // Optimistic Update
    matches.value[targetIdx] = { ...originalMatch, ...payload, _syncing: true }

    try {
      const { data } = await api.patch(`/matches/${id}`, payload)
      const idx = matches.value.findIndex(m => m.id === id)
      if (idx !== -1) matches.value[idx] = data
      logAuditAction('UPDATE_MATCH', id, payload)
      return data
    } catch (err) {
      if (!navigator.onLine) {
        const idx = matches.value.findIndex(m => m.id === id)
        if (idx !== -1) matches.value[idx]._syncing = 'offline'
        offlineQueue.value = offlineQueue.value.filter(q => q.matchId !== id)
        offlineQueue.value.push({ matchId: id, payload, timestamp: Date.now() })
        saveQueue()
        return matches.value[targetIdx]
      } else {
        const idx = matches.value.findIndex(m => m.id === id)
        if (idx !== -1) matches.value[idx] = originalMatch
        throw err
      }
    }
  }

  async function deleteMatch(id) {
    const match = matches.value.find(m => m.id === id)
    await api.delete(`/matches/${id}`)
    matches.value = matches.value.filter(m => m.id !== id)
    logAuditAction('DELETE_MATCH', id, { match_id: id })
  }

  async function fetchMatches(roundId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/matches?round_id=${roundId}`)
      matches.value = data || []
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  /** Subscribe to real-time match updates via SSE */
  function subscribeToMatches(roundId) {
    if (matchEventSource) matchEventSource.close()
    
    const url = `${import.meta.env.VITE_API_URL}/matches/stream/${roundId}`
    matchEventSource = new EventSource(url, { withCredentials: true })

    matchEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data._deleted) {
        matches.value = matches.value.filter(m => m.id !== data.id)
        cumulativeMatches.value = cumulativeMatches.value.filter(m => m.id !== data.id)
      } else {
        const idx = matches.value.findIndex(m => m.id === data.id)
        if (idx !== -1) {
          matches.value[idx] = data
        } else if (matches.value.length > 0 && matches.value[0].round_id === data.round_id) {
          matches.value.push(data)
        }

        const cumIdx = cumulativeMatches.value.findIndex(m => m.id === data.id)
        if (cumIdx !== -1) {
          cumulativeMatches.value[cumIdx] = data
        }
      }
    }

    matchEventSource.onerror = (err) => {
      console.error('SSE Error:', err)
      matchEventSource.close()
    }
  }

  function unsubscribeFromMatches() {
    if (matchEventSource) {
      matchEventSource.close()
      matchEventSource = null
    }
  }

  // ─── Optimistic Updates & Offline Resiliency ─────────────────────────────
  
  const offlineQueue = ref(JSON.parse(localStorage.getItem('ehf_offline_queue') || '[]'))

  function saveQueue() {
    localStorage.setItem('ehf_offline_queue', JSON.stringify(offlineQueue.value))
  }

  async function syncOfflineQueue() {
    if (offlineQueue.value.length === 0 || !navigator.onLine) return

    let remainingQueue = [...offlineQueue.value]
    
    for (const item of offlineQueue.value) {
      if (!item || !item.matchId) continue
      try {
        const { data } = await api.patch(`/matches/${item.matchId}`, item.payload)
        const idx = matches.value.findIndex(m => m.id === item.matchId)
        if (idx !== -1) matches.value[idx] = data
        remainingQueue = remainingQueue.filter(q => q.timestamp !== item.timestamp)
      } catch (e) {
        console.error('Failed to sync offline update:', e)
        remainingQueue = remainingQueue.filter(q => q.timestamp !== item.timestamp)
      }
    }
    
    offlineQueue.value = remainingQueue
    saveQueue()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineQueue)
    setTimeout(syncOfflineQueue, 2000)
  }

  // ─── Audit Logging ───────────────────────────────────────────────────────

  async function logAuditAction(actionName, entityId, payload) {
    try {
      const auth = useAuthStore()
      if (!auth.user?.id) return

      await api.post('/audit', {
        action: actionName,
        entity_id: String(entityId),
        details: payload
      })
    } catch (e) {
      console.warn('Audit Log Warning', e)
    }
  }

  async function updateMatchScore(matchId, homeScore, awayScore, isOT = false) {
    const targetIdx = matches.value.findIndex(m => m.id === matchId)
    if (targetIdx === -1) return null

    const originalMatch = { ...matches.value[targetIdx] }
    matches.value[targetIdx] = {
      ...originalMatch,
      home_score: homeScore,
      away_score: awayScore,
      is_ot: isOT,
      status: 'Completed',
      _syncing: true
    }

    try {
      const { data } = await api.patch(`/matches/${matchId}/score`, {
        home_score: homeScore,
        away_score: awayScore,
        is_ot: isOT
      })
      const idx = matches.value.findIndex(m => m.id === matchId)
      if (idx !== -1) matches.value[idx] = data
      logAuditAction('UPDATE_MATCH_SCORE', matchId, { homeScore, awayScore, isOT })
      return data
    } catch (err) {
      if (!navigator.onLine) {
        const idx = matches.value.findIndex(m => m.id === matchId)
        if (idx !== -1) matches.value[idx]._syncing = 'offline'
        offlineQueue.value.push({ 
          matchId, 
          endpoint: `/matches/${matchId}/score`,
          payload: { home_score: homeScore, away_score: awayScore, is_ot: isOT }, 
          timestamp: Date.now() 
        })
        saveQueue()
        return matches.value[targetIdx]
      } else {
        const idx = matches.value.findIndex(m => m.id === matchId)
        if (idx !== -1) matches.value[idx] = originalMatch
        throw err
      }
    }
  }

  async function markMatchForfeit(matchId, forfeitingTeamSide) {
    const targetIdx = matches.value.findIndex(m => m.id === matchId)
    if (targetIdx === -1) return null

    const originalMatch = { ...matches.value[targetIdx] }
    // IHF Standard 12-0
    const homeScore = forfeitingTeamSide === 'home' ? 0 : 12
    const awayScore = forfeitingTeamSide === 'away' ? 0 : 12
    
    matches.value[targetIdx] = {
      ...originalMatch,
      home_score: homeScore,
      away_score: awayScore,
      status: 'Forfeited',
      forfeit_side: forfeitingTeamSide,
      _syncing: true
    }

    try {
      const { data } = await api.patch(`/matches/${matchId}/forfeit`, { forfeit_side: forfeitingTeamSide })
      const idx = matches.value.findIndex(m => m.id === matchId)
      if (idx !== -1) matches.value[idx] = data
      logAuditAction('MARK_FORFEIT', matchId, { forfeitingTeamSide })
      return data
    } catch (err) {
      const idx = matches.value.findIndex(m => m.id === matchId)
      if (idx !== -1) matches.value[idx] = originalMatch
      throw err
    }
  }

  // ─── Round Finalisation ──────────────────────────────────────────────────

  async function finalizeRound(roundId) {
    // We'll let the backend handle the heavy lifting (snapshotting + status update + next round activation)
    const { data } = await api.post(`/rounds/${roundId}/finalize`, {
        standings: standings.value // we still send the calculated standings to be safe
    })
    
    const current = rounds.value.find(r => r.id === roundId)
    const seasonYear = current?.season_year || selectedSeason.value
    await fetchRounds(seasonYear)
    matches.value = []
    logAuditAction('FINALIZE_ROUND', roundId, {})
  }

  async function deleteRound(roundId) {
    if (!roundId) return
    await api.delete(`/rounds/${roundId}`)
    rounds.value = rounds.value.filter(r => r.id !== roundId)
    if (activeRound.value?.id === roundId) activeRound.value = null
    logAuditAction('DELETE_ROUND', roundId, { round_id: roundId })
  }

  const cumulativeMatches = ref([])
  const cumulativeStandings = computed(() => {
    if (!teams.value.length) return []
    return calculateStandings(cumulativeMatches.value, teams.value)
  })

  async function fetchCumulativeMatches(roundId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/matches/cumulative?round_id=${roundId}`)
      cumulativeMatches.value = data || []
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  function clearMatches() {
    matches.value = []
  }

  function clearRounds() {
    rounds.value = []
    activeRound.value = null
  }

  return {
    teams, rounds, activeRound, matches, cumulativeMatches, standings, cumulativeStandings, loading, error,
    selectedGender, selectedSeason,
    fetchTeams, createTeam, updateTeam, deleteTeam,
    fetchRounds, createRound, setActiveRound,
    fetchMatches, fetchCumulativeMatches, createMatch, updateMatch, deleteMatch,
    subscribeToMatches, unsubscribeFromMatches,
    updateMatchScore, markMatchForfeit,
    finalizeRound, updateRound, deleteRound, clearMatches, clearRounds
  }
})
