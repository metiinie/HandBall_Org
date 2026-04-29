import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

dotenv.config()

import { User } from '../entities/user.entity'
import { Team } from '../entities/team.entity'
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

async function clearMatches() {
  await AppDataSource.initialize()
  console.log('📦 Database connected.')
  console.log('🧹 Clearing matches...')
  await AppDataSource.query('TRUNCATE TABLE "matches" RESTART IDENTITY CASCADE')
  console.log('✅ Matches cleared.')
  await AppDataSource.destroy()
}

clearMatches().catch(err => {
  console.error('❌ Failed to clear matches:', err)
  process.exit(1)
})
