import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { MatchesService } from './matches.service'
import { SseService } from './sse.service'
import { CreateMatchDto, UpdateMatchDto, UpdateScoreDto, ForfeitMatchDto } from './dto/match.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly sseService: SseService,
  ) {}

  @Get()
  findAll(@Query('round_id') round_id?: string) {
    return this.matchesService.findAll(round_id)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body() updateScoreDto: UpdateScoreDto) {
    return this.matchesService.updateScore(id, updateScoreDto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/forfeit')
  forfeit(@Param('id') id: string, @Body() forfeitDto: ForfeitMatchDto) {
    return this.matchesService.forfeit(id, forfeitDto)
  }

  // SSE endpoint for real-time updates
  @Sse('stream/:roundId')
  streamMatches(@Param('roundId') roundId: string): Observable<any> {
    return this.sseService.getSubject(roundId).asObservable()
  }
}
