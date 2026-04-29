import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  user_id: string

  @Column()
  action: string

  @Column({ nullable: true })
  entity_id: string

  @Column({ type: 'jsonb', nullable: true })
  details: any

  @CreateDateColumn()
  created_at: Date
}
