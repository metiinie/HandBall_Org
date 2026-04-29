import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm'
import { RoundSnapshot } from './round-snapshot.entity'

export type RoundStatus = 'Pending' | 'Active' | 'Completed'

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  season_year: number

  @Column()
  round_number: number

  @Column({ type: 'varchar', default: 'Pending' })
  status: RoundStatus

  @Column({ type: 'varchar' })
  gender: string

  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date

  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date

  @OneToOne(() => RoundSnapshot, snapshot => snapshot.round, { onDelete: 'CASCADE' })
  snapshot: RoundSnapshot

  @CreateDateColumn()
  created_at: Date
}
