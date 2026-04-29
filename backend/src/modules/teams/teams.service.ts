import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Team, TeamGender } from '../../entities/team.entity'
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async findAll(gender?: string): Promise<Team[]> {
    const query = this.teamRepo.createQueryBuilder('team').orderBy('team.name', 'ASC')
    if (gender) {
      query.where('team.gender = :gender', { gender })
    }
    return query.getMany()
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamRepo.findOne({ where: { id } })
    if (!team) throw new NotFoundException('Team not found')
    return team
  }

  async create(dto: CreateTeamDto): Promise<Team> {
    const team = this.teamRepo.create(dto)
    return this.teamRepo.save(team)
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findOne(id)
    Object.assign(team, dto)
    return this.teamRepo.save(team)
  }

  async remove(id: string): Promise<void> {
    const result = await this.teamRepo.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Team not found')
    }
  }
}
