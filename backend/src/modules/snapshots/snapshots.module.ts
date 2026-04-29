import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SnapshotsController } from './snapshots.controller'
import { SnapshotsService } from './snapshots.service'
import { RoundSnapshot } from '../../entities/round-snapshot.entity'

@Module({
  imports: [TypeOrmModule.forFeature([RoundSnapshot])],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
