import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Round } from '../../entities/round.entity'
import { CreateRoundDto, UpdateRoundDto } from './dto/round.dto'
import { RoundSnapshot } from '../../entities/round-snapshot.entity'

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
    @InjectRepository(RoundSnapshot)
    private readonly snapshotRepo: Repository<RoundSnapshot>,
  ) {}

  async findAll(gender?: string, season_year?: number): Promise<Round[]> {
    const query = this.roundRepo.createQueryBuilder('round').orderBy('round.round_number', 'ASC')
    if (gender) {
      query.andWhere('round.gender = :gender', { gender })
    }
    if (season_year) {
      query.andWhere('round.season_year = :season_year', { season_year })
    }
    return query.getMany()
  }

  async findOne(id: string): Promise<Round> {
    const round = await this.roundRepo.findOne({ where: { id } })
    if (!round) throw new NotFoundException('Round not found')
    return round
  }

  async create(dto: CreateRoundDto): Promise<Round> {
    const round = this.roundRepo.create({ ...dto, status: dto.status || 'Pending' })
    return this.roundRepo.save(round)
  }

  async update(id: string, dto: UpdateRoundDto): Promise<Round> {
    const round = await this.findOne(id)
    Object.assign(round, dto)
    return this.roundRepo.save(round)
  }

  async activate(id: string): Promise<Round> {
    const targetRound = await this.findOne(id)

    // Deactivate currently active round for same gender and season
    await this.roundRepo.update(
      { gender: targetRound.gender, season_year: targetRound.season_year, status: 'Active' },
      { status: 'Completed' }
    )

    // Activate the target round
    targetRound.status = 'Active'
    return this.roundRepo.save(targetRound)
  }

  async finalize(id: string, standings: any): Promise<Round> {
    const round = await this.findOne(id)
    
    // 1. Create Snapshot
    const snapshot = this.snapshotRepo.create({
      round_id: round.id,
      historical_standings_json: standings,
      round_number: round.round_number,
      season_year: round.season_year,
      gender: round.gender
    })
    await this.snapshotRepo.save(snapshot)

    // 2. Mark Round as Completed
    round.status = 'Completed'
    await this.roundRepo.save(round)

    // 3. Automatically activate next round if it exists
    const nextRound = await this.roundRepo.findOne({
      where: {
        gender: round.gender,
        season_year: round.season_year,
        round_number: round.round_number + 1
      }
    })

    if (nextRound) {
      nextRound.status = 'Active'
      await this.roundRepo.save(nextRound)
    }

    return round
  }

  async remove(id: string): Promise<void> {
    const round = await this.findOne(id)
    await this.roundRepo.remove(round)
  }
}
