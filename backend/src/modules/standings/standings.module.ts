import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StandingsController } from './standings.controller'
import { StandingsService } from './standings.service'
import { Match } from '../../entities/match.entity'
import { Team } from '../../entities/team.entity'
import { Round } from '../../entities/round.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Match, Team, Round])],
  controllers: [StandingsController],
  providers: [StandingsService],
  exports: [StandingsService],
})
export class StandingsModule {}
