import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { TBAMatch } from './tba-match.entity';
import { TeamMatchRecord } from '../scouting/scouting.entity';

@Entity()
export class TBAEvent {
  @PrimaryColumn()
  eventKey: string; // e.g., "2026casj", "2026cmp"

  @Column()
  eventName: string; // e.g., "Sacramento Regional"

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSynced: Date;

  @OneToMany(() => TBAMatch, (match) => match.event)
  matches: TBAMatch[];

  @OneToMany(() => TeamMatchRecord, (record) => record.event)
  scoutingRecords: TeamMatchRecord[];
}
