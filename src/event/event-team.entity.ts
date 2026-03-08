import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ScoutEvent } from './scout-event.entity';
import { Team } from '../team/team.entity';

export enum EventTeamSource {
  MANUAL = 'MANUAL',
  TBA = 'TBA',
}

@Entity({ name: 'event_team' })
@Unique(['scoutEventId', 'teamNumber'])
export class EventTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ScoutEvent, (event) => event.eventTeams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scoutEventId' })
  event: ScoutEvent;

  @Column()
  scoutEventId: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamNumber' })
  team: Team;

  @Column()
  teamNumber: number;

  @Column({
    type: 'enum',
    enum: EventTeamSource,
    default: EventTeamSource.MANUAL,
  })
  source: EventTeamSource;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
