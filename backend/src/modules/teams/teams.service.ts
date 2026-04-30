import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Team, TeamGender } from '../../entities/team.entity'
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly auditService: AuditService,
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

  async create(dto: CreateTeamDto, userId?: string): Promise<Team> {
    const team = this.teamRepo.create(dto)
    const saved = await this.teamRepo.save(team)
    if (userId) await this.auditService.logAction(userId, 'CREATE_TEAM', saved.id, dto)
    return saved
  }

  async update(id: string, dto: UpdateTeamDto, userId?: string): Promise<Team> {
    const team = await this.findOne(id)
    Object.assign(team, dto)
    const saved = await this.teamRepo.save(team)
    if (userId) await this.auditService.logAction(userId, 'UPDATE_TEAM', saved.id, dto)
    return saved
  }

  async remove(id: string, userId?: string): Promise<void> {
    const team = await this.findOne(id)
    const result = await this.teamRepo.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Team not found')
    }
    if (userId) await this.auditService.logAction(userId, 'DELETE_TEAM', id, { team_name: team.name })
  }
}
