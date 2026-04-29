import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()

import { User } from '../entities/user.entity'
import { Team, TeamGender } from '../entities/team.entity'
import { Round } from '../entities/round.entity'
import { Match } from '../entities/match.entity'
import { RoundSnapshot } from '../entities/round-snapshot.entity'
import { AuditLog } from '../entities/audit-log.entity'

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Team, Round, Match, RoundSnapshot, AuditLog],
})

async function seedHandball() {
  await AppDataSource.initialize()
  console.log('📦 Database connected.')

  const teamRepo = AppDataSource.getRepository(Team)
  const roundRepo = AppDataSource.getRepository(Round)
  const matchRepo = AppDataSource.getRepository(Match)

  // 1. Teams from the image (Men & Women)
  const teamNames = [
    'መቐለ 70 እንደርታ',
    'መቻለ',
    'ቂርቆስ ክፍለ ከተማ',
    'ኮልፌ ቀራንዮ ክፍለ ከተማ',
    'አማኑኤል',
    'ፌዴራል ማረሚያ',
    'ከምባታ ዱራሜ'
  ]

  console.log('🌱 Seeding Handball teams (Men & Women)...')
  for (const name of teamNames) {
    // Men
    if (!(await teamRepo.findOne({ where: { name, gender: 'ወንድ' as TeamGender } }))) {
      await teamRepo.save(teamRepo.create({ name, gender: 'ወንድ' as TeamGender }))
    }
    // Women
    if (!(await teamRepo.findOne({ where: { name, gender: 'ሴት' as TeamGender } }))) {
      await teamRepo.save(teamRepo.create({ name, gender: 'ሴት' as TeamGender }))
    }
  }
  console.log('✅ Teams seeded.')

  await AppDataSource.destroy()
  console.log('🏁 Seeding complete.')
}

seedHandball().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
