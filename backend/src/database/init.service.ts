import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../entities/user.entity'
import { Team, TeamGender } from '../entities/team.entity'

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Checking database initialization...')
    await this.seedAdmin()
    await this.seedTeams()
    this.logger.log('✅ Initialization check complete.')
  }

  private async seedAdmin() {
    const adminEmail = 'oriontheman@gmail.com'
    const userCount = await this.userRepo.count()
    
    if (userCount === 0) {
      this.logger.log(`🌱 No users found. Creating default admin: ${adminEmail}`)
      const passwordHash = await bcrypt.hash('123456', 10)
      const admin = this.userRepo.create({
        email: adminEmail,
        password_hash: passwordHash,
        role: 'admin',
      })
      await this.userRepo.save(admin)
      this.logger.log('✅ Admin user created successfully.')
    }
  }

  private async seedTeams() {
    const teamNames = [
      'መቐለ 70 እንደርታ',
      'መቻለ',
      'ቂርቆስ ክፍለ ከተማ',
      'ኮልፌ ቀራንዮ ክፍለ ከተማ',
      'አማኑኤል',
      'ፌዴራል ማረሚያ',
      'ከምባታ ዱራሜ'
    ]

    const teamCount = await this.teamRepo.count()
    if (teamCount === 0) {
      this.logger.log('🌱 Seeding teams...')
      for (const name of teamNames) {
        await this.teamRepo.save(this.teamRepo.create({ name, gender: 'ወንድ' as TeamGender }))
        await this.teamRepo.save(this.teamRepo.create({ name, gender: 'ሴት' as TeamGender }))
      }
      this.logger.log(`✅ ${teamNames.length * 2} teams seeded.`)
    }
  }
}
