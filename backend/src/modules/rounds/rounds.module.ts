import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoundsController } from './rounds.controller'
import { RoundsService } from './rounds.service'
import { Round } from '../../entities/round.entity'
import { RoundSnapshot } from '../../entities/round-snapshot.entity'
import { StandingsModule } from '../standings/standings.module'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [TypeOrmModule.forFeature([Round, RoundSnapshot]), StandingsModule, AuditModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
