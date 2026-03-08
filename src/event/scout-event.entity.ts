import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventMatch } from './event-match.entity';
import { EventTeam } from './event-team.entity';
import { TeamMatchRecord } from '../scouting/scouting.entity';

export enum EventSourceType {
  CUSTOM = 'CUSTOM',
  TBA = 'TBA',
}

@Entity({ name: 'scout_event' })
export class ScoutEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: EventSourceType,
  })
  sourceType: EventSourceType;

  @Column({ nullable: true, unique: true })
  tbaEventKey?: string;

  @Column({ default: false })
  syncEnabled: boolean;

  @Column({ default: 30 })
  syncIntervalMinutes: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => EventTeam, (et) => et.event)
  eventTeams: EventTeam[];

  @OneToMany(() => EventMatch, (em) => em.event)
  eventMatches: EventMatch[];

  @OneToMany(() => TeamMatchRecord, (record) => record.scoutEvent)
  matchRecords: TeamMatchRecord[];
}
