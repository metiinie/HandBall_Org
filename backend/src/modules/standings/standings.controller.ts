import { Controller, Get, Query } from '@nestjs/common'
import { StandingsService, TeamStats } from './standings.service'

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  async getStandings(@Query('round_id') roundId: string): Promise<TeamStats[]> {
    return this.standingsService.getStandingsByRound(roundId)
  }

  @Get('cumulative')
  async getCumulativeStandings(
    @Query('gender') gender: string,
    @Query('season_year') seasonYear: string,
  ): Promise<TeamStats[]> {
    return this.standingsService.getCumulativeStandings(gender, parseInt(seasonYear))
  }
}
