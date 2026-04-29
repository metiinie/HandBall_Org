/**
 * EHF League Standings Calculator
 * Implements IHF-standard handball standings.
 *
 * Scoring:
 *   Win:  2 points
 *   Draw: 1 point
 *   Loss: 0 points
 *   Forfeit/Walkover: 12-0 (IHF standard)
 *
 * Tie-Breaking Order (IHF):
 *   1. Points in head-to-head matches
 *   2. Goal difference in head-to-head matches
 *   3. Greater number of goals scored in head-to-head matches
 *   4. Goal difference in all matches
 *   5. Greater number of goals scored in all matches
 *
 * @param {Array<Object>} matches  - Match records
 * @param {Array<Object>} teams    - Team records
 * @returns {Array<Object>}        - Sorted standings
 */
export function calculateStandings(matches, teams) {
  if (!teams || teams.length === 0) return []

  const completedMatches = matches.filter(
    m => m.status === 'Completed' || m.status === 'Forfeited'
  ).sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  // ─── 1. Build base stats for each team ─────────────────────────────────
  const statsMap = {}
  teams.forEach(team => {
    statsMap[team.id] = {
      team,
      played:    0,
      wins:      0,
      draws:     0,
      losses:    0,
      homeW:     0,
      homeD:     0,
      homeL:     0,
      roadW:     0,
      roadD:     0,
      roadL:     0,
      streak:    '',
      ptsFor:    0,
      ptsAgainst: 0,
      ptsDiff:   0,
      leaguePts: 0,
      forfeits:  0,
      pct:      '.000',
      gb:       '—',
      form:      [],
    }
  })

  // ─── 2. Process each match ──────────────────────────────────────────────
  completedMatches.forEach(match => {
    const home = statsMap[match.home_team_id]
    const away = statsMap[match.away_team_id]
    if (!home || !away) return

    const isForfeited = match.status === 'Forfeited'

    if (isForfeited) {
      _processForfeit(match, home, away)
    } else {
      home.played++
      away.played++
      home.ptsFor    += match.home_score
      home.ptsAgainst += match.away_score
      away.ptsFor    += match.away_score
      away.ptsAgainst += match.home_score

      if (match.home_score > match.away_score) {
        home.wins++; home.leaguePts += 2; home.form.push('W'); home.homeW++
        away.losses++; away.leaguePts += 0; away.form.push('L'); away.roadL++
      } else if (match.home_score < match.away_score) {
        away.wins++; away.leaguePts += 2; away.form.push('W'); away.roadW++
        home.losses++; home.leaguePts += 0; home.form.push('L'); home.homeL++
      } else {
        home.draws++; home.leaguePts += 1; home.form.push('D'); home.homeD++
        away.draws++; away.leaguePts += 1; away.form.push('D'); away.roadD++
      }
    }
  })

  // ─── 3. Finalize Individual Stats ──────────────────────────────────────
  Object.values(statsMap).forEach(s => {
    s.ptsDiff = s.ptsFor - s.ptsAgainst
    s.form = s.form.slice(-5)

    // Calculate Streak
    if (s.form.length > 0) {
      let count = 0
      const last = s.form[s.form.length - 1]
      for (let i = s.form.length - 1; i >= 0; i--) {
        if (s.form[i] === last) count++
        else break
      }
      s.streak = `${last}${count}`
    }
  })

  const standings = Object.values(statsMap)

  // ─── 4. Sort with IHF tie-breaking ─────────────────────────────────────
  const sorted = _sortStandings(standings, completedMatches)

  // ─── 5. Assign Ranks ──────────────────────────────────────────────────
  if (sorted.length > 0) {
    sorted.forEach((s, i) => {
      s.rank = i + 1
      s.gb = '—' // GB is not typically used in Handball leagues
    })
  }

  return sorted
}

function _processForfeit(match, home, away) {
  if (!home || !away) return
  home.played++
  away.played++
  
  // IHF standard: 12-0
  const score = 12
  const side = match.forfeit_side ?? (match.home_score === 0 && match.away_score === 12 ? 'home' : 'away')

  if (side === 'home') {
    home.homeL++; home.form.push('L')
    home.forfeits++
    away.wins++; away.leaguePts += 2; away.form.push('W'); away.roadW++
    away.ptsFor += score; home.ptsAgainst += score
  } else {
    away.roadL++; away.form.push('L')
    away.forfeits++
    home.wins++; home.leaguePts += 2; home.form.push('W'); home.homeW++
    home.ptsFor += score; away.ptsAgainst += score
  }
}

export function _sortStandings(standings, allMatches) {
  standings.sort((a, b) => b.leaguePts - a.leaguePts)
  const result = []
  let i = 0
  while (i < standings.length) {
    let j = i + 1
    while (j < standings.length && standings[j].leaguePts === standings[i].leaguePts) j++
    const group = standings.slice(i, j)
    if (group.length === 1) result.push(group[0])
    else result.push(..._resolveTiedGroup(group, allMatches))
    i = j
  }
  return result
}

function _resolveTiedGroup(group, allMatches) {
  const tiedIds = new Set(group.map(s => s.team.id))
  const h2hMatches = allMatches.filter(m => tiedIds.has(m.home_team_id) && tiedIds.has(m.away_team_id) && (m.status === 'Completed' || m.status === 'Forfeited') && m.home_score !== null && m.away_score !== null)
  
  const h2h = {}
  group.forEach(s => { h2h[s.team.id] = { leaguePts: 0, ptsFor: 0, ptsAgainst: 0, ptsDiff: 0 } })
  
  h2hMatches.forEach(match => {
    const home = h2h[match.home_team_id]
    const away = h2h[match.away_team_id]
    if (!home || !away) return
    home.ptsFor += match.home_score
    home.ptsAgainst += match.away_score
    away.ptsFor += match.away_score
    away.ptsAgainst += match.home_score
    if (match.home_score > match.away_score) { 
        home.leaguePts += 2 
    } else if (match.away_score > match.home_score) { 
        away.leaguePts += 2 
    } else { 
        home.leaguePts += 1; away.leaguePts += 1 
    }
  })

  Object.values(h2h).forEach(s => { s.ptsDiff = s.ptsFor - s.ptsAgainst })

  // Sort by IHF Tie-break rules
  group.sort((a, b) => {
    const ha = h2h[a.team.id]
    const hb = h2h[b.team.id]
    
    // 1. Points in head-to-head matches
    if (hb.leaguePts !== ha.leaguePts) return hb.leaguePts - ha.leaguePts
    
    // 2. Goal difference in head-to-head matches
    if (hb.ptsDiff !== ha.ptsDiff) return hb.ptsDiff - ha.ptsDiff
    
    // 3. Greater number of goals scored in head-to-head matches
    if (hb.ptsFor !== ha.ptsFor) return hb.ptsFor - ha.ptsFor
    
    // 4. Goal difference in all matches
    if (b.ptsDiff !== a.ptsDiff) return b.ptsDiff - a.ptsDiff
    
    // 5. Greater number of goals scored in all matches
    if (b.ptsFor !== a.ptsFor) return b.ptsFor - a.ptsFor
    
    return a.team.name.localeCompare(b.team.name)
  })
  return group
}
