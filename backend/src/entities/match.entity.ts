import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm'
import { Round } from './round.entity'
import { Team } from './team.entity'

export type MatchStatus = 'Scheduled' | 'Completed' | 'Forfeited'
export type ForfeitSide = 'home' | 'away' | 'both'

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  round_id: string

  @ManyToOne(() => Round, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round: Round

  @Column()
  home_team_id: string

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'home_team_id' })
  home_team: Team

  @Column()
  away_team_id: string

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'away_team_id' })
  away_team: Team

  @Column({ type: 'int', nullable: true })
  home_score: number

  @Column({ type: 'int', nullable: true })
  away_score: number

  @Column({ type: 'varchar', nullable: true })
  forfeit_side: ForfeitSide

  @Column({ type: 'varchar', default: 'Scheduled' })
  status: MatchStatus

  @Column({ nullable: true })
  venue: string

  @Column({ type: 'timestamptz', nullable: true })
  match_date: Date

  @Column({ type: 'boolean', default: false })
  is_ot: boolean  // Extra Time (ET) flag — handball golden goal periods

  @CreateDateColumn()
  created_at: Date
}
