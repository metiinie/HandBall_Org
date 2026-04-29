import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import * as dotenv from 'dotenv'

dotenv.config()
import { AuthModule } from './modules/auth/auth.module'
import { TeamsModule } from './modules/teams/teams.module'
import { RoundsModule } from './modules/rounds/rounds.module'
import { MatchesModule } from './modules/matches/matches.module'
import { SnapshotsModule } from './modules/snapshots/snapshots.module'
import { AuditModule } from './modules/audit/audit.module'

import { User } from './entities/user.entity'
import { Team } from './entities/team.entity'
import { Round } from './entities/round.entity'
import { Match } from './entities/match.entity'
import { RoundSnapshot } from './entities/round-snapshot.entity'
import { AuditLog } from './entities/audit-log.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      entities: [User, Team, Round, Match, RoundSnapshot, AuditLog],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development' ? ['error'] : false,
    }),
    AuthModule,
    TeamsModule,
    RoundsModule,
    MatchesModule,
    SnapshotsModule,
    AuditModule,
  ],
})
export class AppModule {}
