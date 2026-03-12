import {
  Alliance,
  FetchBallPreference,
  MatchType,
  TowerStatus,
} from '../scouting.entity';
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  Min,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Autonomous {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  autoStart: number;

  @IsBoolean()
  leftStartingZone: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fuelCount?: number;

  @IsOptional()
  @IsBoolean()
  isTowerSuccess?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  shotsTaken?: number;

  @IsOptional()
  @IsString()
  shotVolumes?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subjectiveAccuracy?: number;
}


export class Teleop {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fuelCount?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  humanFuelCount?: number;

  @IsOptional()
  @IsBoolean()
  passBump?: boolean;

  @IsOptional()
  @IsBoolean()
  passTrench?: boolean;

  @IsOptional()
  @IsEnum(FetchBallPreference)
  fetchBallPreference?: FetchBallPreference;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  shotsTaken?: number;

  @IsOptional()
  @IsString()
  shotVolumes?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subjectiveAccuracy?: number;
}


export class EndAndAfterGame {
  @IsEnum(TowerStatus)
  towerStatus: TowerStatus;

  @IsString()
  @IsOptional()
  comments: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  climbingTime: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  rankingPoint: number;

  @IsBoolean()
  @IsOptional()
  coopPoint: boolean;

  @IsBoolean()
  @IsOptional()
  autonomousMove: boolean;

  @IsBoolean()
  @IsOptional()
  teleopMove: boolean;
}

export class CreateTeamRecordDto {
  @IsString()
  scoutEventId: string;

  @IsString()
  @IsOptional()
  eventMatchId?: string;

  @IsEnum(MatchType)
  matchType: MatchType;

  @IsEnum(Alliance)
  alliance: Alliance;

  @IsInt()
  @Min(1)
  teamNumber: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  matchNumber?: number;

  @ValidateNested()
  @Type(() => Autonomous)
  @IsDefined()
  autonomous: Autonomous;

  @ValidateNested()
  @IsDefined()
  @Type(() => Teleop)
  teleop: Teleop;

  @ValidateNested()
  @IsDefined()
  @Type(() => EndAndAfterGame)
  endAndAfterGame: EndAndAfterGame;
}
