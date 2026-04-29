import { Controller, Get, Query } from '@nestjs/common'
import { SnapshotsService } from './snapshots.service'

@Controller('snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  findAll(@Query('season_year') season_year?: string) {
    const yearNum = season_year ? parseInt(season_year, 10) : undefined
    return this.snapshotsService.findAll(yearNum)
  }
}
