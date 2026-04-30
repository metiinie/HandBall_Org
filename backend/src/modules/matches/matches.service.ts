import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Match } from '../../entities/match.entity'
import { CreateMatchDto, UpdateMatchDto, UpdateScoreDto, ForfeitMatchDto } from './dto/match.dto'
import { SseService } from './sse.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    private readonly sseService: SseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(round_id?: string): Promise<Match[]> {
    const query = this.matchRepo.createQueryBuilder('match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.round', 'round')
      .orderBy('match.match_date', 'ASC')

    if (round_id) {
      query.where('match.round_id = :round_id', { round_id })
    }

    return query.getMany()
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepo.findOne({
      where: { id },
      relations: ['home_team', 'away_team', 'round'],
    })
    if (!match) throw new NotFoundException('Match not found')
    return match
  }

  async create(dto: CreateMatchDto, userId?: string): Promise<Match> {
    const match = this.matchRepo.create(dto)
    const saved = await this.matchRepo.save(match)
    const fullMatch = await this.findOne(saved.id)
    this.sseService.emitMatchUpdate(fullMatch.round_id, fullMatch)
    if (userId) await this.auditService.logAction(userId, 'CREATE_MATCH', fullMatch.id, dto)
    return fullMatch
  }

  async update(id: string, dto: UpdateMatchDto, userId?: string): Promise<Match> {
    const match = await this.findOne(id)
    Object.assign(match, dto)
    const saved = await this.matchRepo.save(match)
    this.sseService.emitMatchUpdate(saved.round_id, saved)
    if (userId) await this.auditService.logAction(userId, 'UPDATE_MATCH', saved.id, dto)
    return saved
  }

  async remove(id: string, userId?: string): Promise<void> {
    const match = await this.findOne(id)
    await this.matchRepo.delete(id)
    this.sseService.emitMatchUpdate(match.round_id, { id: match.id, _deleted: true })
    if (userId) await this.auditService.logAction(userId, 'DELETE_MATCH', match.id, { round_id: match.round_id })
  }

  async updateScore(id: string, dto: UpdateScoreDto, userId?: string): Promise<Match> {
    const match = await this.findOne(id)
    match.home_score = dto.home_score
    match.away_score = dto.away_score
    match.is_ot = dto.is_ot || false
    match.status = 'Completed'
    match.forfeit_side = null // clear any previous forfeit
    
    const saved = await this.matchRepo.save(match)
    this.sseService.emitMatchUpdate(saved.round_id, saved)
    if (userId) await this.auditService.logAction(userId, 'UPDATE_MATCH_SCORE', saved.id, dto)
    return saved
  }

  async forfeit(id: string, dto: ForfeitMatchDto, userId?: string): Promise<Match> {
    const match = await this.findOne(id)
    match.status = 'Forfeited'
    match.forfeit_side = dto.forfeit_side
    
    // IHF Forfeit Standard: 10-0
    if (dto.forfeit_side === 'home') {
      match.home_score = 0
      match.away_score = 10
    } else if (dto.forfeit_side === 'away') {
      match.home_score = 10
      match.away_score = 0
    } else {
      match.home_score = 0
      match.away_score = 0
    }
    
    const saved = await this.matchRepo.save(match)
    this.sseService.emitMatchUpdate(saved.round_id, saved)
    if (userId) await this.auditService.logAction(userId, 'MARK_FORFEIT', saved.id, dto)
    return saved
  }
}
