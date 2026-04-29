import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoundSnapshot } from '../../entities/round-snapshot.entity'

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectRepository(RoundSnapshot)
    private readonly snapshotRepo: Repository<RoundSnapshot>,
  ) {}

  async findAll(season_year?: number): Promise<RoundSnapshot[]> {
    const query = this.snapshotRepo.createQueryBuilder('snapshot')
    if (season_year) {
      query.where('snapshot.season_year = :season_year', { season_year })
    }
    return query.getMany()
  }
}
