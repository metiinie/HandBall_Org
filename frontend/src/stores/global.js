import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api.js'
import { _sortStandings } from '@/utils/standings.js'

export const useGlobalStore = defineStore('global', () => {
  const snapshots = ref([])
  const globalStandings = ref([])
  const seasonYears = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchGlobalStandings(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      // Get snapshots
      const url = seasonYear ? `/snapshots?season_year=${seasonYear}` : '/snapshots'
      const { data } = await api.get(url)
      
      const validSnapshots = data || []
      snapshots.value = validSnapshots

      const years = [...new Set(validSnapshots.map(s => s.season_year).filter(Boolean))]
      seasonYears.value = years.sort((a, b) => b - a)

      // We need to get matches for these rounds for H2H tiebreakers
      let allMatches = []
      if (validSnapshots.length > 0) {
         // In a real production environment, you might want a specific endpoint to fetch cumulative matches
         // For now, we'll fetch matches per round in parallel
         const roundIds = [...new Set(validSnapshots.map(s => s.round_id))]
         const promises = roundIds.map(rid => api.get(`/matches?round_id=${rid}`))
         const results = await Promise.all(promises)
         results.forEach(res => {
            if (res.data) {
                const completedMatches = res.data.filter(m => m.status === 'Completed' || m.status === 'Forfeited')
                allMatches = allMatches.concat(completedMatches)
            }
         })
      }

      globalStandings.value = aggregateStandings(validSnapshots, allMatches)
    } catch (e) {
      error.value = e.message || 'Failed to fetch global standings'
    } finally {
      loading.value = false
    }
  }

  function aggregateStandings(snapshotsData, allMatches) {
    const aggregate = {}

    snapshotsData.forEach(snapshot => {
      const standings = snapshot.historical_standings_json || []
      standings.forEach(entry => {
        const id = entry.team.id
        if (!aggregate[id]) {
          aggregate[id] = {
            team: entry.team,
            played: 0, wins: 0, draws: 0, losses: 0,
            homeW: 0, homeD: 0, homeL: 0, roadW: 0, roadD: 0, roadL: 0,
            ptsFor: 0, ptsAgainst: 0, ptsDiff: 0,
            leaguePts: 0, forfeits: 0, roundsPlayed: 0,
          }
        }
        aggregate[id].played     += entry.played
        aggregate[id].wins       += entry.wins
        aggregate[id].draws      += (entry.draws || 0)
        aggregate[id].losses     += entry.losses
        aggregate[id].homeW      += (entry.homeW || 0)
        aggregate[id].homeD      += (entry.homeD || 0)
        aggregate[id].homeL      += (entry.homeL || 0)
        aggregate[id].roadW      += (entry.roadW || 0)
        aggregate[id].roadD      += (entry.roadD || 0)
        aggregate[id].roadL      += (entry.roadL || 0)
        aggregate[id].ptsFor     += entry.ptsFor
        aggregate[id].ptsAgainst += entry.ptsAgainst
        aggregate[id].ptsDiff    += entry.ptsDiff
        aggregate[id].leaguePts  += entry.leaguePts
        aggregate[id].forfeits   += (entry.forfeits || 0)
        aggregate[id].roundsPlayed++
      })
    })

    Object.values(aggregate).forEach(s => {
      if (s.played > 0) {
        // PCT in handball (usually not used much, but kept for compatibility)
        // treating draw as 0.5 win for PCT calculation
        const p = (s.wins + (s.draws * 0.5)) / s.played
        s.pct = p === 1 ? '1.000' : p.toFixed(3).replace(/^0/, '')
      } else {
        s.pct = '.000'
      }
    })

    const rawStandings = Object.values(aggregate)
    const sorted = _sortStandings(rawStandings, allMatches)
    
    // Recalculate rank
    if (sorted.length > 0) {
      sorted.forEach((s, i) => {
        s.rank = i + 1
        s.gb = '—' // GB doesn't make much sense in Handball standard points system
      })
    }
    return sorted
  }

  return { snapshots, globalStandings, seasonYears, loading, error, fetchGlobalStandings }
})
