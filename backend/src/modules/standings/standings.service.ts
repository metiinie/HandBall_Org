import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Match } from '../../entities/match.entity'
import { Team } from '../../entities/team.entity'
import { Round } from '../../entities/round.entity'

export interface TeamStats {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  homeW: number
  homeD: number
  homeL: number
  roadW: number
  roadD: number
  roadL: number
  ptsFor: number
  ptsAgainst: number
  ptsDiff: number
  leaguePts: number
  forfeits: number
  rank?: number
}

@Injectable()
export class StandingsService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
  ) {}

  async getStandingsByRound(roundId: string): Promise<TeamStats[]> {
    const round = await this.roundRepo.findOne({ where: { id: roundId } })
    if (!round) return []

    const teams = await this.teamRepo.find({ where: { gender: round.gender as any } })
    const matches = await this.matchRepo.find({ 
      where: { round_id: roundId },
      relations: ['home_team', 'away_team']
    })

    return this.calculateStandings(matches, teams)
  }

  async getCumulativeStandings(gender: string, seasonYear: number): Promise<TeamStats[]> {
    const teams = await this.teamRepo.find({ where: { gender: gender as any } })
    
    const matches = await this.matchRepo.createQueryBuilder('match')
      .leftJoinAndSelect('match.round', 'round')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .where('round.gender = :gender', { gender })
      .andWhere('round.season_year = :seasonYear', { seasonYear })
      .getMany()

    return this.calculateStandings(matches, teams)
  }

  private calculateStandings(matches: Match[], teams: Team[]): TeamStats[] {
    const statsMap: Record<string, TeamStats> = {}

    teams.forEach(team => {
      statsMap[team.id] = {
        team,
        played: 0, wins: 0, draws: 0, losses: 0,
        homeW: 0, homeD: 0, homeL: 0,
        roadW: 0, roadD: 0, roadL: 0,
        ptsFor: 0, ptsAgainst: 0, ptsDiff: 0,
        leaguePts: 0, forfeits: 0,
      }
    })

    const completedMatches = matches.filter(m => m.status === 'Completed' || m.status === 'Forfeited')

    completedMatches.forEach(match => {
      const home = statsMap[match.home_team_id]
      const away = statsMap[match.away_team_id]
      if (!home || !away) return

      if (match.status === 'Forfeited') {
        this.processForfeit(match, home, away)
      } else {
        home.played++
        away.played++
        home.ptsFor += match.home_score || 0
        home.ptsAgainst += match.away_score || 0
        away.ptsFor += match.away_score || 0
        away.ptsAgainst += match.home_score || 0

        if (match.home_score > match.away_score) {
          home.wins++; home.leaguePts += 2; home.homeW++
          away.losses++; away.roadL++
        } else if (match.home_score < match.away_score) {
          away.wins++; away.leaguePts += 2; away.roadW++
          home.losses++; home.homeL++
        } else {
          home.draws++; home.leaguePts += 1; home.homeD++
          away.draws++; away.leaguePts += 1; away.roadD++
        }
      }
    })

    Object.values(statsMap).forEach(s => {
      s.ptsDiff = s.ptsFor - s.ptsAgainst
    })

    const standings = Object.values(statsMap)
    const sorted = this.sortStandings(standings, completedMatches)

    sorted.forEach((s, i) => { s.rank = i + 1 })
    return sorted
  }

  private processForfeit(match: Match, home: TeamStats, away: TeamStats) {
    home.played++
    away.played++
    
    // IHF standard: 10-0
    const score = 10
    const side = match.forfeit_side

    if (side === 'home') {
      home.homeL++; home.forfeits++
      away.wins++; away.leaguePts += 2; away.roadW++
      away.ptsFor += score; home.ptsAgainst += score
    } else if (side === 'away') {
      away.roadL++; away.forfeits++
      home.wins++; home.leaguePts += 2; home.homeW++
      home.ptsFor += score; away.ptsAgainst += score
    } else {
      // Both side forfeit (rare)
      home.forfeits++; away.forfeits++
      home.homeL++; away.roadL++
    }
  }

  private sortStandings(standings: TeamStats[], allMatches: Match[]): TeamStats[] {
    standings.sort((a, b) => b.leaguePts - a.leaguePts)
    
    const result: TeamStats[] = []
    let i = 0
    while (i < standings.length) {
      let j = i + 1
      while (j < standings.length && standings[j].leaguePts === standings[i].leaguePts) j++
      
      const group = standings.slice(i, j)
      if (group.length === 1) {
        result.push(group[0])
      } else {
        result.push(...this.resolveTiedGroup(group, allMatches))
      }
      i = j
    }
    return result
  }

  private resolveTiedGroup(group: TeamStats[], allMatches: Match[]): TeamStats[] {
    const tiedIds = new Set(group.map(s => s.team.id))
    const h2hMatches = allMatches.filter(m => tiedIds.has(m.home_team_id) && tiedIds.has(m.away_team_id))
    
    const h2h: Record<string, { leaguePts: number, ptsFor: number, ptsAgainst: number, ptsDiff: number }> = {}
    group.forEach(s => { 
      h2h[s.team.id] = { leaguePts: 0, ptsFor: 0, ptsAgainst: 0, ptsDiff: 0 } 
    })
    
    h2hMatches.forEach(match => {
      const home = h2h[match.home_team_id]
      const away = h2h[match.away_team_id]
      if (!home || !away) return

      home.ptsFor += match.home_score || 0
      home.ptsAgainst += match.away_score || 0
      away.ptsFor += match.away_score || 0
      away.ptsAgainst += match.home_score || 0

      if (match.status === 'Forfeited') {
        const score = 10
        if (match.forfeit_side === 'home') {
            away.leaguePts += 2; away.ptsFor += score; home.ptsAgainst += score
        } else if (match.forfeit_side === 'away') {
            home.leaguePts += 2; home.ptsFor += score; away.ptsAgainst += score
        }
      } else {
        if (match.home_score > match.away_score) { 
          home.leaguePts += 2 
        } else if (match.away_score > match.home_score) { 
          away.leaguePts += 2 
        } else { 
          home.leaguePts += 1; away.leaguePts += 1 
        }
      }
    })

    Object.values(h2h).forEach(s => { s.ptsDiff = s.ptsFor - s.ptsAgainst })

    group.sort((a, b) => {
      const ha = h2h[a.team.id]
      const hb = h2h[b.team.id]
      
      if (hb.leaguePts !== ha.leaguePts) return hb.leaguePts - ha.leaguePts
      if (hb.ptsDiff !== ha.ptsDiff) return hb.ptsDiff - ha.ptsDiff
      if (hb.ptsFor !== ha.ptsFor) return hb.ptsFor - ha.ptsFor
      if (b.ptsDiff !== a.ptsDiff) return b.ptsDiff - a.ptsDiff
      if (b.ptsFor !== a.ptsFor) return b.ptsFor - a.ptsFor
      
      return a.team.name.localeCompare(b.team.name)
    })
    
    return group
  }
}
