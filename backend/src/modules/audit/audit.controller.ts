import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common'
import { AuditService } from './audit.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  logAction(@Req() req: any, @Body() body: any) {
    const user_id = req.user.id
    return this.auditService.logAction(user_id, body.action, body.entity_id, body.details)
  }
}
