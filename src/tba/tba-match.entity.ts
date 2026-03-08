import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TBAEvent } from './tba-event.entity';
import { TeamMatchRecord } from '../scouting/scouting.entity';

@Entity()
export class TBAMatch {
  @PrimaryColumn()
  matchKey: string; // e.g., "2026casj_qm1", "2026casj_sf1m1"

  @ManyToOne(() => TBAEvent, (event) => event.matches)
  @JoinColumn({ name: 'eventKey' })
  event: TBAEvent;

  @Column()
  eventKey: string;

  @Column()
  matchNumber: number;

  @Column({
    type: 'enum',
    enum: [
      'practice',
      'qualification',
      'playoff',
      'final',
      'semifinal',
      'quarterfinal',
      'eighthfinal',
    ],
  })
  matchType: string;

  @Column('json', { nullable: true })
  redAlliance: number[]; // [team1, team2, team3]

  @Column('json', { nullable: true })
  blueAlliance: number[]; // [team1, team2, team3]

  @Column({ nullable: true })
  scoreRedFinal?: number;

  @Column({ nullable: true })
  scoreBlueFinal?: number;

  @Column({ type: 'json', nullable: true })
  scoreBreakdown?: any; // Detailed TBA score data

  @OneToMany(() => TeamMatchRecord, (record) => record.tbaMatch)
  scoutingRecords: TeamMatchRecord[];
}
