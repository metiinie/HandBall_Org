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

async function clearData() {
  await AppDataSource.initialize()
  console.log('📦 Database connected.')

  console.log('🧹 Clearing teams, rounds, matches, and logs...')
  
  // Disable constraints to truncate related tables
  await AppDataSource.query('TRUNCATE TABLE "matches" RESTART IDENTITY CASCADE')
  await AppDataSource.query('TRUNCATE TABLE "round_snapshots" RESTART IDENTITY CASCADE')
  await AppDataSource.query('TRUNCATE TABLE "rounds" RESTART IDENTITY CASCADE')
  await AppDataSource.query('TRUNCATE TABLE "teams" RESTART IDENTITY CASCADE')
  await AppDataSource.query('TRUNCATE TABLE "audit_logs" RESTART IDENTITY CASCADE')

  console.log('✅ Tables cleared successfully (Matches, Rounds, Teams, Snapshots, Logs).')
  
  await AppDataSource.destroy()
  console.log('🏁 Operation complete.')
}

clearData().catch(err => {
  console.error('❌ Failed to clear database:', err)
  process.exit(1)
})
