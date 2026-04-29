import { describe, it, expect } from 'vitest'
import { calculateStandings } from './standings.js'

describe('EHF Standings Calculator (IHF Rules)', () => {
  
  const mockTeams = [
    { id: '1', name: 'Team A' },
    { id: '2', name: 'Team B' },
    { id: '3', name: 'Team C' },
    { id: '4', name: 'Team D' }
  ]

  it('calculates basic Win/Draw/Loss League Points correctly', () => {
    const matches = [
      { home_team_id: '1', away_team_id: '2', home_score: 30, away_score: 25, status: 'Completed' }, // 1 beats 2 (Win)
      { home_team_id: '1', away_team_id: '3', home_score: 20, away_score: 20, status: 'Completed' } // 1 ties 3 (Draw)
    ]

    const standings = calculateStandings(matches, mockTeams)
    
    // Team A: 1 Win (2 pts) + 1 Draw (1 pt) = 3 pts
    const teamA = standings.find(s => s.team.id === '1')
    expect(teamA.leaguePts).toBe(3)
    expect(teamA.wins).toBe(1)
    expect(teamA.draws).toBe(1)
    expect(teamA.form).toEqual(['W', 'D'])
    
    // Team B: 1 Loss (0 pts)
    const teamB = standings.find(s => s.team.id === '2')
    expect(teamB.leaguePts).toBe(0)
    expect(teamB.losses).toBe(1)
    
    // Team C: 1 Draw (1 pt)
    const teamC = standings.find(s => s.team.id === '3')
    expect(teamC.leaguePts).toBe(1)
    expect(teamC.draws).toBe(1)
  })

  it('resolves ties using IHF Head-to-Head rules', () => {
    const matches = [
      { home_team_id: '1', away_team_id: '2', home_score: 25, away_score: 20, status: 'Completed' }, // 1 beats 2 (H2H)
      { home_team_id: '3', away_team_id: '4', home_score: 30, away_score: 20, status: 'Completed' },
      
      { home_team_id: '2', away_team_id: '3', home_score: 25, away_score: 20, status: 'Completed' }, // 2 beats 3
      { home_team_id: '4', away_team_id: '1', home_score: 25, away_score: 20, status: 'Completed' }, // 4 beats 1
    ]
    // 1, 2, 3, 4 all have 1 Win (2 pts).
    
    // Let's add a match to make 1 and 2 tied at 4 pts
    const matches2 = [
        ...matches,
        { home_team_id: '1', away_team_id: '3', home_score: 25, away_score: 20, status: 'Completed' }, // 1 beats 3 (1 has 4pts)
        { home_team_id: '2', away_team_id: '4', home_score: 25, away_score: 20, status: 'Completed' }, // 2 beats 4 (2 has 4pts)
    ]
    
    const standings = calculateStandings(matches2, mockTeams)
    // Team 1 and 2 both have 4 pts.
    // In their H2H match (first match), 1 beat 2 (25-20).
    // So 1 should be ranked above 2.
    
    const rank1 = standings.find(s => s.team.id === '1').rank
    const rank2 = standings.find(s => s.team.id === '2').rank
    expect(rank1).toBeLessThan(rank2)
  })

  it('resolves 3-way ties using IHF rules (H2H GD then H2H GS)', () => {
    // 1 beats 2 (30-20) -> 1 is +10, 2 is -10
    // 2 beats 3 (30-20) -> 2 is +10 (total 0), 3 is -10
    // 3 beats 1 (25-20) -> 3 is +5 (total -5), 1 is -5 (total +5)
    
    const matches = [
      { home_team_id: '1', away_team_id: '2', home_score: 30, away_score: 20, status: 'Completed' },
      { home_team_id: '2', away_team_id: '3', home_score: 30, away_score: 20, status: 'Completed' },
      { home_team_id: '3', away_team_id: '1', home_score: 25, away_score: 20, status: 'Completed' }
    ]
    
    // H2H Table:
    // Team 1: 1W 1L (2pts), GD +5 (30+20 vs 20+25 = 50-45)GS 50
    // Team 2: 1W 1L (2pts), GD 0 (20+30 vs 30+20 = 50-50) GS 50
    // Team 3: 1W 1L (2pts), GD -5 (20+25 vs 30+20 = 45-50) GS 45
    
    const standings = calculateStandings(matches, mockTeams)
    
    expect(standings[0].team.id).toBe('1')
    expect(standings[1].team.id).toBe('2')
    expect(standings[2].team.id).toBe('3')
  })

  it('processes IHF forfeit (12-0, 2 pts for winner, 0 pts for loser)', () => {
    const matches = [
       { home_team_id: '1', away_team_id: '2', forfeit_side: 'home', status: 'Forfeited' }
    ]

    const standings = calculateStandings(matches, mockTeams)
    
    const team2 = standings.find(s => s.team.id === '2')
    expect(team2.wins).toBe(1)
    expect(team2.leaguePts).toBe(2)
    expect(team2.ptsFor).toBe(12)
    
    const team1 = standings.find(s => s.team.id === '1')
    expect(team1.leaguePts).toBe(0)
    expect(team1.ptsAgainst).toBe(12)
    expect(team1.forfeits).toBe(1)
  })
})
