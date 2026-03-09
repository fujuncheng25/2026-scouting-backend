import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamMatchRecord, MatchType } from './scouting.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeamRecordDto } from './dto/create-team-match-record.dto';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { TeamService } from '../team/team.service';
import { EventMatch } from '../event/event-match.entity';
import { EventTeam } from '../event/event-team.entity';
import { EventTeamSource } from '../event/event-team.entity';

@Injectable()
export class ScoutingService {
  constructor(
    @InjectRepository(TeamMatchRecord)
    private readonly teamMatchRecordRepository: Repository<TeamMatchRecord>,
    @InjectRepository(EventMatch)
    private readonly eventMatchRepository: Repository<EventMatch>,
    @InjectRepository(EventTeam)
    private readonly eventTeamRepository: Repository<EventTeam>,
    private readonly userService: UserService,
    private teamService: TeamService,
  ) {}

  async createTeamRecord(
    teamMatchRecordDto: CreateTeamRecordDto,
    userId: string,
  ): Promise<void> {
    const user = await this.userService.getUserByEmail(userId);
    const data = instanceToPlain(teamMatchRecordDto);
    const record = plainToClass(TeamMatchRecord, data);
    if (user === null) {
      throw new NotFoundException('User does not exist');
    }
    record.user = user;
    await this.teamMatchRecordRepository.save(
      plainToClass(TeamMatchRecord, data),
    );
  }

  async create(createDto: CreateTeamRecordDto, userId: string) {
    const user = await this.userService.getUserByEmail(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use reference version approach: simple team creation and record creation
    // But add event relationships for both TBA and Custom modes
    const team = await this.teamService.findOrCreate(createDto.teamNumber);

    let eventMatch: EventMatch | null = null;
    let matchNumber = createDto.matchNumber || 0;

    // Handle TBA mode: if eventMatchId provided, get the EventMatch
    if (createDto.eventMatchId && createDto.eventMatchId.trim() !== '') {
      eventMatch = await this.eventMatchRepository.findOne({
        where: { id: createDto.eventMatchId },
        relations: ['tbaMatch'],
      });
      if (!eventMatch) {
        throw new NotFoundException('Event match not found');
      }

      // For TBA events, use the match number from EventMatch
      matchNumber = eventMatch.matchNumber ?? createDto.matchNumber ?? 0;
    } else {
      // For Custom events (no eventMatchId), use matchNumber from DTO, default to 0 if not provided
      matchNumber = createDto.matchNumber ?? 0;
    }

    // Ensure team is registered for the event (important for Custom events)
    let eventTeam = await this.eventTeamRepository.findOne({
      where: {
        scoutEventId: createDto.scoutEventId,
        teamNumber: createDto.teamNumber,
      },
    });

    if (!eventTeam) {
      // Create event-team relationship if it doesn't exist
      eventTeam = this.eventTeamRepository.create({
        scoutEventId: createDto.scoutEventId,
        teamNumber: createDto.teamNumber,
        team: team,
        source: EventTeamSource.MANUAL,
      });
      await this.eventTeamRepository.save(eventTeam);
    }

    // Create match record using reference version approach + event relationships
    const matchRecord = this.teamMatchRecordRepository.create({
      scoutEventId: createDto.scoutEventId,  // Always set event relationship
      eventMatchId: eventMatch?.id,          // TBA mode: set eventMatch
      eventMatch: eventMatch || undefined,   // TBA mode: set relation
      matchType: createDto.matchType,
      matchNumber: matchNumber,              // Use calculated matchNumber
      alliance: createDto.alliance,
      autonomous: createDto.autonomous,
      teleop: createDto.teleop,
      endAndAfterGame: createDto.endAndAfterGame,
      user: user,
      team: team,
      matchKey: eventMatch?.tbaMatchKey,     // TBA mode: set TBA keys
      eventKey: eventMatch?.tbaMatch?.eventKey,
    });

    const response = await this.teamMatchRecordRepository.save(matchRecord);
    return response;
  }

  async findAll() {
    return await this.teamMatchRecordRepository.find({
      relations: ['user', 'team'],
    });
  }

  async findTeamMatches(teamNumber: number, matchType?: MatchType) {
    const queryBuilder = this.teamMatchRecordRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.team', 'team')
      .leftJoinAndSelect('match.user', 'user')
      .where('team.number = :teamNumber', { teamNumber });

    if (matchType) {
      queryBuilder.andWhere('match.matchType = :matchType', { matchType });
    }

    const matches = await queryBuilder
      .orderBy('match.matchNumber', 'ASC')
      .getMany();

    if (matches.length === 0) {
      throw new NotFoundException(`No matches found for team ${teamNumber}`);
    }

    return matches.map((match) => ({
      id: match.id,
      matchType: match.matchType,
      matchNumber: match.matchNumber,
      alliance: match.alliance,
      autonomous: match.autonomous,
      teleop: match.teleop,
      endAndAfterGame: match.endAndAfterGame,
      scoutedBy: {
        name: match.user.name,
      },
    }));
  }

  async findAllMatches() {
    const allMatches = await this.teamMatchRecordRepository.find({
      relations: ['team', 'user'],
    });

    return allMatches.map((match) => ({
      id: match.id,
      matchType: match.matchType,
      matchNumber: match.matchNumber,
      alliance: match.alliance,
      autonomous: match.autonomous,
      teleop: match.teleop,
      endAndAfterGame: match.endAndAfterGame,
      team: match.team.number,
      scoutedBy: {
        name: match.user.name,
      },
    }));
  }

  async deleteMatchRecord(id: string) {
    const record = await this.teamMatchRecordRepository.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!record) {
      throw new NotFoundException(`Match record with ID ${id} not found`);
    }

    await this.teamMatchRecordRepository.remove(record);
    return { message: 'Match record deleted successfully' };
  }

  async deleteTeamMatches(teamNumber: number) {
    const records = await this.teamMatchRecordRepository.find({
      where: { team: { number: teamNumber } },
      relations: ['team'],
    });

    if (records.length === 0) {
      throw new NotFoundException(
        `No match records found for team ${teamNumber}`,
      );
    }

    await this.teamMatchRecordRepository.remove(records);
    return {
      message: `All match records for team ${teamNumber} deleted successfully`,
    };
  }

  async deleteAll() {
    await this.teamMatchRecordRepository.clear();
    return { message: 'All match records deleted successfully' };
  }

  async update(id: string, updateDto: any, userId: string) {
    // Find the existing record
    const existingRecord = await this.teamMatchRecordRepository.findOne({
      where: { id },
      relations: ['team', 'user'],
    });

    if (!existingRecord) {
      throw new NotFoundException(`Match record with ID ${id} not found`);
    }

    // Get the user
    const user = await this.userService.getUserByEmail(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the team (in case it changed)
    const teamNumber = updateDto.team;
    const team = await this.teamService.findOrCreate(teamNumber);

    // Create a properly formatted DTO from the incoming data
    const formattedData = {
      matchType: updateDto.matchType, // Keep existing match type if not provided
      matchNumber: updateDto.matchNumber, // Keep existing match number if not provided
      alliance: updateDto.alliance,
      autonomous: updateDto.autonomous,
      teleop: updateDto.teleop,
      endAndAfterGame: updateDto.endAndAfterGame,
      team: team,
      user: user,
    };

    // Update the record
    Object.assign(existingRecord, formattedData);

    // Save and return the updated record
    const updated = await this.teamMatchRecordRepository.save(existingRecord);

    return {
      id: updated.id,
      matchType: updated.matchType,
      matchNumber: updated.matchNumber,
      alliance: updated.alliance,
      team: updated.team.number,
      autonomous: updated.autonomous,
      teleop: updated.teleop,
      endAndAfterGame: updated.endAndAfterGame,
      scoutedBy: {
        name: updated.user.name,
      },
    };
  }

  async findEventMatchRecords(eventId: string, teamNumber?: number, matchType?: MatchType) {

    const query = this.teamMatchRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.team', 'team')
      .leftJoinAndSelect('record.user', 'user')
      .leftJoinAndSelect('record.scoutEvent', 'scoutEvent')
      .where('scoutEvent.id = :eventId', { eventId });

    if (teamNumber) {
      query.andWhere('team.number = :teamNumber', { teamNumber });
    }

    if (matchType) {
      query.andWhere('record.matchType = :matchType', { matchType });
    }

    const records = await query
      .orderBy('record.matchNumber', 'ASC')
      .addOrderBy('team.number', 'ASC')
      .getMany();


    const result = records.map(record => ({
      id: record.id,
      matchType: record.matchType,
      matchNumber: record.matchNumber,
      alliance: record.alliance,
      team: record.team.number,
      autonomous: record.autonomous,
      teleop: record.teleop,
      endAndAfterGame: record.endAndAfterGame,
      scoutedBy: {
        name: record.user.name,
      },
      scoutEvent: {
        id: record.scoutEvent?.id,
        name: record.scoutEvent?.name,
      },
    }));

    return result;
  }
}
