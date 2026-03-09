import { Test, TestingModule } from '@nestjs/testing';
import { TBAEvent } from './tba-event.entity';
import { TBAMatch } from './tba-match.entity';
import { TeamMatchRecord } from '../scouting/scouting.entity';

describe('TBAEvent Entity', () => {
  let event: TBAEvent;

  beforeEach(() => {
    event = new TBAEvent();
  });

  it('should create a TBAEvent with default values', () => {
    expect(event).toBeDefined();
    expect(event.eventKey).toBeUndefined();
    expect(event.eventName).toBeUndefined();
    expect(event.lastSynced).toBeInstanceOf(Date);
    expect(event.matches).toEqual([]);
    expect(event.scoutingRecords).toEqual([]);
  });

  it('should set event properties correctly', () => {
    const testEventKey = '2026casj';
    const testEventName = 'Sacramento Regional';

    event.eventKey = testEventKey;
    event.eventName = testEventName;

    expect(event.eventKey).toBe(testEventKey);
    expect(event.eventName).toBe(testEventName);
  });

  it('should handle relationships with matches', () => {
    const mockMatch = new TBAMatch();
    mockMatch.matchKey = '2026casj_qm1';
    mockMatch.eventKey = '2026casj';

    event.matches = [mockMatch];

    expect(event.matches).toHaveLength(1);
    expect(event.matches[0].matchKey).toBe('2026casj_qm1');
    expect(event.matches[0].eventKey).toBe('2026casj');
  });

  it('should handle relationships with scouting records', () => {
    const mockRecord = new TeamMatchRecord();
    mockRecord.eventKey = '2026casj';

    event.scoutingRecords = [mockRecord];

    expect(event.scoutingRecords).toHaveLength(1);
    expect(event.scoutingRecords[0].eventKey).toBe('2026casj');
  });
});
