import { Test, TestingModule } from '@nestjs/testing';
import { TBAMatch } from './tba-match.entity';
import { TBAEvent } from './tba-event.entity';
import { TeamMatchRecord } from '../scouting/scouting.entity';

describe('TBAMatch Entity', () => {
  let match: TBAMatch;

  beforeEach(() => {
    match = new TBAMatch();
  });

  it('should create a TBAMatch with default values', () => {
    expect(match).toBeDefined();
    expect(match.matchKey).toBeUndefined();
    expect(match.eventKey).toBeUndefined();
    expect(match.matchNumber).toBeUndefined();
    expect(match.matchType).toBeUndefined();
    expect(match.redAlliance).toBeNull();
    expect(match.blueAlliance).toBeNull();
    expect(match.scoreRedFinal).toBeUndefined();
    expect(match.scoreBlueFinal).toBeUndefined();
    expect(match.scoreBreakdown).toBeUndefined();
    expect(match.scoutingRecords).toEqual([]);
  });

  it('should set match properties correctly', () => {
    const testMatchKey = '2026casj_qm1';
    const testEventKey = '2026casj';
    const testMatchNumber = 1;
    const testMatchType = 'qualification';
    const testRedAlliance = [254, 1678, 2910];
    const testBlueAlliance = [971, 604, 5012];
    const testRedScore = 156;
    const testBlueScore = 89;

    match.matchKey = testMatchKey;
    match.eventKey = testEventKey;
    match.matchNumber = testMatchNumber;
    match.matchType = testMatchType;
    match.redAlliance = testRedAlliance;
    match.blueAlliance = testBlueAlliance;
    match.scoreRedFinal = testRedScore;
    match.scoreBlueFinal = testBlueScore;

    expect(match.matchKey).toBe(testMatchKey);
    expect(match.eventKey).toBe(testEventKey);
    expect(match.matchNumber).toBe(testMatchNumber);
    expect(match.matchType).toBe(testMatchType);
    expect(match.redAlliance).toEqual(testRedAlliance);
    expect(match.blueAlliance).toEqual(testBlueAlliance);
    expect(match.scoreRedFinal).toBe(testRedScore);
    expect(match.scoreBlueFinal).toBe(testBlueScore);
  });

  it('should handle TBA score breakdown', () => {
    const mockScoreBreakdown = {
      red: {
        autoTowerPoints: 5,
        autoFuelPoints: 10,
        totalAuto: 15,
        teleopFuelPoints: 20,
        endgameTowerPoints: 10,
        totalScore: 45,
        rankingPoints: 2,
      },
      blue: {
        autoTowerPoints: 0,
        autoFuelPoints: 5,
        totalAuto: 5,
        teleopFuelPoints: 15,
        endgameTowerPoints: 0,
        totalScore: 20,
        rankingPoints: 0,
      },
    };

    match.scoreBreakdown = mockScoreBreakdown;

    expect(match.scoreBreakdown).toEqual(mockScoreBreakdown);
    expect(match.scoreBreakdown.red.totalScore).toBe(45);
    expect(match.scoreBreakdown.blue.totalScore).toBe(20);
  });

  it('should handle relationships with scouting records', () => {
    const mockRecord = new TeamMatchRecord();
    mockRecord.matchKey = '2026casj_qm1';

    match.scoutingRecords = [mockRecord];

    expect(match.scoutingRecords).toHaveLength(1);
    expect(match.scoutingRecords[0].matchKey).toBe('2026casj_qm1');
  });

  it('should validate match type enum', () => {
    const validTypes = ['practice', 'qualification', 'playoff'];

    validTypes.forEach((type) => {
      match.matchType = type;
      expect(match.matchType).toBe(type);
    });
  });
});
