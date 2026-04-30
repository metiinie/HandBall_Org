import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Sse, Req } from '@nestjs/common'
import { Observable, interval, map, merge } from 'rxjs'
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
  create(@Req() req: any, @Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.matchesService.remove(id, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Req() req: any, @Body() updateScoreDto: UpdateScoreDto) {
    return this.matchesService.updateScore(id, updateScoreDto, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/forfeit')
  forfeit(@Param('id') id: string, @Req() req: any, @Body() forfeitDto: ForfeitMatchDto) {
    return this.matchesService.forfeit(id, forfeitDto, req.user.id)
  }

  // SSE endpoint for real-time updates
  @Sse('stream/:roundId')
  streamMatches(@Param('roundId') roundId: string): Observable<any> {
    const heartbeat = interval(15000).pipe(map(() => ({ data: { type: 'ping' } })))
    const updates = this.sseService.getSubject(roundId).asObservable()
    return merge(heartbeat, updates)
  }
}
