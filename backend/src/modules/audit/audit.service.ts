import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLog } from '../../entities/audit-log.entity'

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(user_id: string, action: string, entity_id?: string, details?: any) {
    const log = this.auditRepo.create({ user_id, action, entity_id, details })
    return this.auditRepo.save(log)
  }
}
