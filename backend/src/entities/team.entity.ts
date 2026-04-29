import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export type TeamGender = 'ወንድ' | 'ሴት'

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'varchar' })
  gender: TeamGender

  @Column({ nullable: true })
  logo_url: string

  @CreateDateColumn()
  created_at: Date
}
