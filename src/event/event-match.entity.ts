import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ScoutEvent } from './scout-event.entity';
import { TBAMatch } from '../tba/tba-match.entity';

export enum EventMatchSource {
  MANUAL = 'MANUAL',
  TBA = 'TBA',
}

@Entity({ name: 'event_match' })
@Unique(['scoutEventId', 'tbaMatchKey'])
export class EventMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ScoutEvent, (event) => event.eventMatches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scoutEventId' })
  event: ScoutEvent;

  @Column()
  scoutEventId: string;

  @ManyToOne(() => TBAMatch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tbaMatchKey' })
  tbaMatch?: TBAMatch;

  @Column({ nullable: true })
  tbaMatchKey?: string;

  @Column({
    type: 'enum',
    enum: EventMatchSource,
    default: EventMatchSource.MANUAL,
  })
  source: EventMatchSource;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  matchNumber?: number;

  @Column({ nullable: true })
  compLevel?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledTime?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
