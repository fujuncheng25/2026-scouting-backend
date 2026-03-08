import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutEvent, EventSourceType } from './scout-event.entity';
import { EventMatch, EventMatchSource } from './event-match.entity';
import { EventTeam, EventTeamSource } from './event-team.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(ScoutEvent)
    private readonly scoutEventRepo: Repository<ScoutEvent>,
    @InjectRepository(EventMatch)
    private readonly eventMatchRepo: Repository<EventMatch>,
    @InjectRepository(EventTeam)
    private readonly eventTeamRepo: Repository<EventTeam>,
  ) {}

  async createCustomEvent(name: string): Promise<ScoutEvent> {
    const event = this.scoutEventRepo.create({
      name,
      sourceType: EventSourceType.CUSTOM,
      syncEnabled: false,
    });
    return this.scoutEventRepo.save(event);
  }

  async createTbaEvent(name: string, tbaEventKey: string): Promise<ScoutEvent> {
    if (!tbaEventKey) {
      throw new BadRequestException('tbaEventKey is required');
    }

    const existing = await this.scoutEventRepo.findOne({
      where: { tbaEventKey },
    });
    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
      }
      existing.sourceType = EventSourceType.TBA;
      existing.syncEnabled = true;
      existing.syncIntervalMinutes = existing.syncIntervalMinutes || 30;
      return this.scoutEventRepo.save(existing);
    }

    const event = this.scoutEventRepo.create({
      name,
      sourceType: EventSourceType.TBA,
      tbaEventKey,
      syncEnabled: true,
      syncIntervalMinutes: 30,
    });
    return this.scoutEventRepo.save(event);
  }

  async findAllEvents(): Promise<ScoutEvent[]> {
    return this.scoutEventRepo.find({
      order: { updatedAt: 'DESC' } as any,
    });
  }

  async getEventOrThrow(id: string): Promise<ScoutEvent> {
    const event = await this.scoutEventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async listEventTeams(eventId: string): Promise<EventTeam[]> {
    await this.getEventOrThrow(eventId);
    return this.eventTeamRepo.find({
      where: { scoutEventId: eventId },
      order: { teamNumber: 'ASC' },
      relations: ['team'],
    });
  }

  async listEventMatches(eventId: string): Promise<EventMatch[]> {
    await this.getEventOrThrow(eventId);
    return this.eventMatchRepo.find({
      where: { scoutEventId: eventId },
      order: { matchNumber: 'ASC' },
      relations: ['tbaMatch'],
    });
  }

  async addTeamToEventManual(
    eventId: string,
    teamNumber: number,
  ): Promise<EventTeam> {
    const event = await this.getEventOrThrow(eventId);

    const exists = await this.eventTeamRepo.findOne({
      where: { scoutEventId: eventId, teamNumber },
    });
    if (exists) return exists;

    const et = this.eventTeamRepo.create({
      scoutEventId: event.id,
      teamNumber,
      source: EventTeamSource.MANUAL,
    });
    return this.eventTeamRepo.save(et);
  }

  async addManualMatch(
    eventId: string,
    displayName: string,
    matchNumber?: number,
  ): Promise<EventMatch> {
    const event = await this.getEventOrThrow(eventId);

    const em = this.eventMatchRepo.create({
      scoutEventId: event.id,
      source: EventMatchSource.MANUAL,
      displayName,
      matchNumber,
    });
    return this.eventMatchRepo.save(em);
  }
}
