import { Controller, Get } from '@nestjs/common'
import { InjectConnection, InjectRepository } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { User } from './entities/user.entity'

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  getHello(): string {
    return '🤾 EHF League Management API is live! Access endpoints via /api'
  }

  @Get('health')
  async getHealth() {
    let dbStatus = 'Connected'
    let userCount = 0
    try {
      userCount = await this.userRepo.count()
    } catch (e) {
      dbStatus = `Error: ${e.message}`
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connection: dbStatus,
        isInitialized: this.connection.isInitialized,
        seeding: userCount > 0 ? 'Completed' : 'Pending (Check DB_SYNC)',
      },
      environment: process.env.NODE_ENV,
    }
  }
}
