import { DataSource } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load .env relative to project root
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
  synchronize: true, // we use synchronize for this dev DB
})

async function seed() {
  await AppDataSource.initialize()
  console.log('📦 Database connected.')

  // --- Seed Custom Admin User ---
  const userRepo = AppDataSource.getRepository(User)
  const customEmail = 'oriontheman@gmail.com'
  let customAdmin = await userRepo.findOne({ where: { email: customEmail } })
  if (!customAdmin) {
    const hash = await bcrypt.hash('123456', 10)
    customAdmin = userRepo.create({
      email: customEmail,
      password_hash: hash,
      role: 'admin',
    })
    await userRepo.save(customAdmin)
    console.log('✅ Custom Admin user created: oriontheman@gmail.com / 123456')
  } else {
    // Update password just in case
    const hash = await bcrypt.hash('123456', 10)
    customAdmin.password_hash = hash
    await userRepo.save(customAdmin)
    console.log('ℹ️ Custom Admin user updated with latest password.')
  }

  await AppDataSource.destroy()
  console.log('🏁 Seeding complete.')
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
