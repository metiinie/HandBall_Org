import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm'
import { Round } from './round.entity'

@Entity('round_snapshots')
export class RoundSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  round_id: string

  @OneToOne(() => Round, round => round.snapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round: Round

  @Column({ type: 'jsonb' })
  historical_standings_json: any

  // Store round metadata inline for easy querying without a join
  @Column({ nullable: true })
  round_number: number

  @Column({ nullable: true })
  season_year: number

  @Column({ nullable: true })
  gender: string

  @CreateDateColumn()
  created_at: Date
}
