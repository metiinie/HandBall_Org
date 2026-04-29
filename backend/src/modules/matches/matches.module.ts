import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MatchesController } from './matches.controller'
import { MatchesService } from './matches.service'
import { SseService } from './sse.service'
import { Match } from '../../entities/match.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  controllers: [MatchesController],
  providers: [MatchesService, SseService],
  exports: [MatchesService],
})
export class MatchesModule {}
