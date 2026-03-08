import { Test, TestingModule } from '@nestjs/testing';
import {
  TeamMatchRecord,
  MatchType,
  Alliance,
  Autonomous,
  Teleop,
  EndAndAfterGame,
  FetchBallPreference,
  TowerStatus,
} from './scouting.entity';
import { Team } from '../team/team.entity';
import { User } from '../user/user.entity';
import { TBAEvent } from '../tba/tba-event.entity';
import { TBAMatch } from '../tba/tba-match.entity';

describe('TeamMatchRecord Entity', () => {
  let record: TeamMatchRecord;

  beforeEach(() => {
    record = new TeamMatchRecord();
  });

  it('should create a TeamMatchRecord with default values', () => {
    expect(record).toBeDefined();
    expect(record.id).toBeUndefined();
    expect(record.eventKey).toBeUndefined();
    expect(record.matchKey).toBeUndefined();
    expect(record.matchType).toBeUndefined();
    expect(record.matchNumber).toBeUndefined();
    expect(record.alliance).toBeUndefined();
    expect(record.autonomous).toBeInstanceOf(Autonomous);
    expect(record.teleop).toBeInstanceOf(Teleop);
    expect(record.endAndAfterGame).toBeInstanceOf(EndAndAfterGame);
  });

  it('should set TBA event and match relationships', () => {
    const testEventKey = '2026casj';
    const testMatchKey = '2026casj_qm1';

    record.eventKey = testEventKey;
    record.matchKey = testMatchKey;

    expect(record.eventKey).toBe(testEventKey);
    expect(record.matchKey).toBe(testMatchKey);
  });

  it('should handle TBA event relationship', () => {
    const mockEvent = new TBAEvent();
    mockEvent.eventKey = '2026casj';
    mockEvent.eventName = 'Sacramento Regional';

    record.event = mockEvent;

    expect(record.event).toBe(mockEvent);
    expect(record.event.eventKey).toBe('2026casj');
  });

  it('should handle TBA match relationship', () => {
    const mockMatch = new TBAMatch();
    mockMatch.matchKey = '2026casj_qm1';
    mockMatch.eventKey = '2026casj';

    record.tbaMatch = mockMatch;

    expect(record.tbaMatch).toBe(mockMatch);
    expect(record.tbaMatch.matchKey).toBe('2026casj_qm1');
  });

  it('should set match properties correctly', () => {
    record.matchType = MatchType.QUAL;
    record.matchNumber = 1;
    record.alliance = Alliance.RED;

    expect(record.matchType).toBe(MatchType.QUAL);
    expect(record.matchNumber).toBe(1);
    expect(record.alliance).toBe(Alliance.RED);
  });

  it('should handle autonomous data', () => {
    const mockAutonomous = new Autonomous();
    mockAutonomous.autoStart = 1;
    mockAutonomous.leftStartingZone = true;
    mockAutonomous.fuelCount = 5;
    mockAutonomous.isTowerSuccess = true;

    record.autonomous = mockAutonomous;

    expect(record.autonomous.autoStart).toBe(1);
    expect(record.autonomous.leftStartingZone).toBe(true);
    expect(record.autonomous.fuelCount).toBe(5);
    expect(record.autonomous.isTowerSuccess).toBe(true);
  });

  it('should handle teleop data', () => {
    const mockTeleop = new Teleop();
    mockTeleop.fuelCount = 20;
    mockTeleop.humanFuelCount = 10;
    mockTeleop.passBump = true;
    mockTeleop.fetchBallPreference = FetchBallPreference.DEPOT;

    record.teleop = mockTeleop;

    expect(record.teleop.fuelCount).toBe(20);
    expect(record.teleop.humanFuelCount).toBe(10);
    expect(record.teleop.passBump).toBe(true);
    expect(record.teleop.fetchBallPreference).toBe(FetchBallPreference.DEPOT);
  });

  it('should handle endgame data', () => {
    const mockEndGame = new EndAndAfterGame();
    mockEndGame.towerStatus = TowerStatus.L2;
    mockEndGame.comments = 'Great climbing';
    mockEndGame.climbingTime = 15;
    mockEndGame.rankingPoint = 1;
    mockEndGame.autonomousMove = true;

    record.endAndAfterGame = mockEndGame;

    expect(record.endAndAfterGame.towerStatus).toBe(TowerStatus.L2);
    expect(record.endAndAfterGame.comments).toBe('Great climbing');
    expect(record.endAndAfterGame.climbingTime).toBe(15);
    expect(record.endAndAfterGame.rankingPoint).toBe(1);
    expect(record.endAndAfterGame.autonomousMove).toBe(true);
  });

  it('should handle team and user relationships', () => {
    const mockTeam = new Team();
    mockTeam.number = 254;
    mockTeam.name = 'Cheesy Poofs';

    const mockUser = new User();
    mockUser.email = 'test@example.com';
    mockUser.name = 'Test User';

    record.team = mockTeam;
    record.user = mockUser;

    expect(record.team.number).toBe(254);
    expect(record.team.name).toBe('Cheesy Poofs');
    expect(record.user.email).toBe('test@example.com');
    expect(record.user.name).toBe('Test User');
  });

  it('should validate match type enum', () => {
    const validTypes = Object.values(MatchType);

    validTypes.forEach((type) => {
      record.matchType = type;
      expect(record.matchType).toBe(type);
    });
  });

  it('should validate alliance enum', () => {
    const validAlliances = Object.values(Alliance);

    validAlliances.forEach((alliance) => {
      record.alliance = alliance;
      expect(record.alliance).toBe(alliance);
    });
  });
});
