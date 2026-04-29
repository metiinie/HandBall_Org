import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete } from '@nestjs/common'
import { RoundsService } from './rounds.service'
import { CreateRoundDto, UpdateRoundDto } from './dto/round.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get()
  findAll(
    @Query('gender') gender?: string,
    @Query('season_year') season_year?: string,
  ) {
    const yearNum = season_year ? parseInt(season_year, 10) : undefined
    return this.roundsService.findAll(gender, yearNum)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createRoundDto: CreateRoundDto) {
    return this.roundsService.create(createRoundDto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoundDto: UpdateRoundDto) {
    return this.roundsService.update(id, updateRoundDto)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.roundsService.activate(id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/finalize')
  finalize(@Param('id') id: string, @Body() body: { standings: any }) {
    return this.roundsService.finalize(id, body.standings)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roundsService.remove(id)
  }
}
