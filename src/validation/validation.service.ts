import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TBAMatch } from '../tba/tba-match.entity';
import { TeamMatchRecord, Alliance } from '../scouting/scouting.entity';

interface TBAAllianceData {
  score: number;
  team_keys: string[];
  [key: string]: any; // Allow dynamic TBA fields
}

interface TBAScoreData {
  red: TBAAllianceData;
  blue: TBAAllianceData;
}

interface ScoutingTotals {
  totalScore: number;
  [key: string]: number;
}

interface ValidationResult {
  matchKey: string;
  redAlliance: AllianceValidation;
  blueAlliance: AllianceValidation;
  overallAccuracy: number;
  discrepancies: Discrepancy[];
  lastValidated: Date;
}

interface AllianceValidation {
  accuracy: number;
  discrepancies: Discrepancy[];
  scoutingScore: number;
  tbaScore: number;
}

interface Discrepancy {
  field: string;
  scoutingValue: number | boolean | string;
  tbaValue: number | boolean | string;
  difference: number | boolean;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectRepository(TBAMatch)
    private readonly tbaMatchRepository: Repository<TBAMatch>,
    @InjectRepository(TeamMatchRecord)
    private readonly scoutingRepository: Repository<TeamMatchRecord>,
  ) {}

  async validateMatchScouting(matchKey: string): Promise<ValidationResult> {
    try {
      // Get TBA match data
      const tbaMatch = await this.tbaMatchRepository.findOne({
        where: { matchKey },
      });

      if (!tbaMatch) {
        throw new Error(`TBA match ${matchKey} not found`);
      }

      // Get all scouting records for this match
      const scoutingRecords = await this.scoutingRepository.find({
        where: { matchKey },
      });

      // Calculate alliance totals from scouting
      const redValidation = this.calculateAllianceValidation(
        scoutingRecords.filter((r) => r.alliance === Alliance.RED),
        tbaMatch.scoreBreakdown?.red || {},
        tbaMatch.scoreRedFinal || 0,
      );

      const blueValidation = this.calculateAllianceValidation(
        scoutingRecords.filter((r) => r.alliance === Alliance.BLUE),
        tbaMatch.scoreBreakdown?.blue || {},
        tbaMatch.scoreBlueFinal || 0,
      );

      const discrepancies = [
        ...redValidation.discrepancies,
        ...blueValidation.discrepancies,
      ];
      const overallAccuracy =
        (redValidation.accuracy + blueValidation.accuracy) / 2;

      return {
        matchKey,
        redAlliance: redValidation,
        blueAlliance: blueValidation,
        overallAccuracy,
        discrepancies,
        lastValidated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to validate match ${matchKey}:`, error);
      throw error;
    }
  }

  private calculateAllianceValidation(
    scoutingRecords: TeamMatchRecord[],
    tbaBreakdown: TBAAllianceData,
    tbaFinalScore: number,
  ): AllianceValidation {
    // Calculate scouting totals from all records
    const scoutingTotals = this.calculateScoutingTotals(scoutingRecords);

    // Compare with TBA data
    const discrepancies = this.compareScores(
      scoutingRecords,
      tbaBreakdown,
      tbaFinalScore,
    );

    // Calculate accuracy
    const totalFields = Object.keys(tbaBreakdown || {}).length + 1; // +1 for final score
    const matchingFields =
      discrepancies.length === 0
        ? totalFields
        : totalFields - discrepancies.length;
    const accuracy = (matchingFields / totalFields) * 100;

    return {
      accuracy,
      discrepancies,
      scoutingScore: scoutingTotals.totalScore,
      tbaScore: tbaFinalScore,
    };
  }

  private calculateScoutingTotals(records: TeamMatchRecord[]) {
    return records.reduce(
      (totals, record) => {
        // Auto period
        totals.autoTowerPoints += record.autonomous.isTowerSuccess ? 5 : 0;
        totals.autoFuelPoints += record.autonomous.fuelCount;
        totals.totalAuto += totals.autoTowerPoints + totals.autoFuelPoints;

        // Teleop period
        totals.teleopFuelPoints +=
          record.teleop.fuelCount + record.teleop.humanFuelCount;

        // Endgame
        totals.endgameTowerPoints += this.getEndgamePoints(
          record.endAndAfterGame.towerStatus,
        );

        // Total score
        totals.totalScore =
          totals.totalAuto +
          totals.teleopFuelPoints +
          totals.endgameTowerPoints;

        return totals;
      },
      {
        autoTowerPoints: 0,
        autoFuelPoints: 0,
        totalAuto: 0,
        teleopFuelPoints: 0,
        endgameTowerPoints: 0,
        totalScore: 0,
      },
    );
  }

  private getEndgamePoints(towerStatus: string): number {
    switch (towerStatus) {
      case 'L1':
        return 10;
      case 'L2':
        return 20;
      case 'L3':
        return 30;
      default:
        return 0;
    }
  }

  private compareScores(
    scoutingRecords: TeamMatchRecord[],
    tba: TBAAllianceData,
    tbaFinalScore: number,
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    // Validate total score
    const scoutingTotal = scoutingRecords.reduce(
      (sum, record) => sum + this.calculateRecordScore(record),
      0,
    );

    if (scoutingTotal !== tbaFinalScore) {
      discrepancies.push({
        field: 'totalScore',
        scoutingValue: scoutingTotal,
        tbaValue: tbaFinalScore,
        difference: scoutingTotal - tbaFinalScore,
      });
    }

    // Compare breakdown fields
    const fieldsToCompare = [
      'autoTowerPoints',
      'autoFuelPoints',
      'totalAuto',
      'teleopFuelPoints',
      'endgameTowerPoints',
    ];

    fieldsToCompare.forEach((field) => {
      const scoutingValue = this.calculateFieldTotal(scoutingRecords, field);
      const tbaValue = (tba as any)[field] || 0;

      if (scoutingValue !== tbaValue) {
        discrepancies.push({
          field,
          scoutingValue,
          tbaValue,
          difference: scoutingValue - tbaValue,
        });
      }
    });

    return discrepancies;
  }

  private calculateFieldTotal(
    records: TeamMatchRecord[],
    field: string,
  ): number {
    switch (field) {
      case 'autoTowerPoints':
        return records.reduce(
          (sum, record) => sum + (record.autonomous.isTowerSuccess ? 5 : 0),
          0,
        );
      case 'autoFuelPoints':
        return records.reduce(
          (sum, record) => sum + record.autonomous.fuelCount,
          0,
        );
      case 'totalAuto':
        return records.reduce(
          (sum, record) =>
            sum +
            (record.autonomous.isTowerSuccess ? 5 : 0) +
            record.autonomous.fuelCount,
          0,
        );
      case 'teleopFuelPoints':
        return records.reduce(
          (sum, record) =>
            sum + record.teleop.fuelCount + record.teleop.humanFuelCount,
          0,
        );
      case 'endgameTowerPoints':
        return records.reduce(
          (sum, record) =>
            sum + this.getEndgamePoints(record.endAndAfterGame.towerStatus),
          0,
        );
      default:
        return 0;
    }
  }

  private calculateRecordScore(record: TeamMatchRecord): number {
    const autoTowerPoints = record.autonomous.isTowerSuccess ? 5 : 0;
    const autoFuelPoints = record.autonomous.fuelCount;
    const totalAuto = autoTowerPoints + autoFuelPoints;

    const teleopFuelPoints =
      record.teleop.fuelCount + record.teleop.humanFuelCount;

    const endgameTowerPoints = this.getEndgamePoints(
      record.endAndAfterGame.towerStatus,
    );

    return totalAuto + teleopFuelPoints + endgameTowerPoints;
  }
}
