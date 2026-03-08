import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TBAEvent as TBAEventType,
  TBAMatch as TBAMatchType,
  TBATeam,
} from './tba.types';
import { TBAEvent } from './tba-event.entity';
import { TBAMatch } from './tba-match.entity';
import { Team } from '../team/team.entity';
import { ScoutEvent } from '../event/scout-event.entity';
import { EventTeam, EventTeamSource } from '../event/event-team.entity';
import { EventMatch, EventMatchSource } from '../event/event-match.entity';

@Injectable()
export class TBAService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(TBAEvent)
    private readonly eventRepository: Repository<TBAEvent>,
    @InjectRepository(TBAMatch)
    private readonly matchRepository: Repository<TBAMatch>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(ScoutEvent)
    private readonly scoutEventRepository: Repository<ScoutEvent>,
    @InjectRepository(EventTeam)
    private readonly eventTeamRepository: Repository<EventTeam>,
    @InjectRepository(EventMatch)
    private readonly eventMatchRepository: Repository<EventMatch>,
  ) {
    this.apiKey = this.configService.get<string>('TBA_API_KEY')!;
    this.baseUrl = this.configService.get<string>(
      'TBA_BASE_URL',
      'https://www.thebluealliance.com/api/v3',
    );

    if (!this.apiKey) {
      throw new Error('TBA_API_KEY environment variable is required');
    }
  }

  async getEvents(
    year: number = new Date().getFullYear(),
  ): Promise<TBAEventType[]> {
    try {
      console.log(`Fetching TBA events for year: ${year}`);
      const response = await this.httpService
        .get(`/events/${year}`, {
          headers: {
            'X-TBA-Auth-Key': this.apiKey,
            Accept: 'application/json',
          },
        })
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from TBA API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      console.log(
        `Successfully fetched ${response.data.length} events for ${year}`,
      );
      return response.data;
    } catch (error) {
      console.error('TBA API Error:', error.message);
      throw new HttpException(
        'Failed to fetch events from TBA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEventTeams(eventKey: string): Promise<TBATeam[]> {
    try {
      const response = await this.httpService
        .get(`/event/${eventKey}/teams`, {
          headers: {
            'X-TBA-Auth-Key': this.apiKey,
            Accept: 'application/json',
          },
        })
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from TBA API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch teams for event ${eventKey}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEventMatches(eventKey: string): Promise<TBAMatchType[]> {
    try {
      const response = await this.httpService
        .get(`/event/${eventKey}/matches`, {
          headers: {
            'X-TBA-Auth-Key': this.apiKey,
            Accept: 'application/json',
          },
        })
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from TBA API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch matches for event ${eventKey}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMatch(matchKey: string): Promise<TBAMatchType> {
    try {
      const response = await this.httpService
        .get(`/match/${matchKey}`, {
          headers: {
            'X-TBA-Auth-Key': this.apiKey,
            Accept: 'application/json',
          },
        })
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from TBA API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch match ${matchKey}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  transformTBAMatch(tbaData: TBAMatchType): TBAMatch {
    const match = new TBAMatch();
    match.matchKey = tbaData.key;
    match.eventKey = tbaData.event_key;
    match.matchNumber = tbaData.match_number;

    // Map TBA comp_level to our enum
    const compLevelMap: { [key: string]: string } = {
      pr: 'practice',
      qm: 'qualification',
      ef: 'eighthfinal',
      qf: 'quarterfinal',
      sf: 'semifinal',
      f: 'final',
    };
    match.matchType = compLevelMap[tbaData.comp_level] || 'playoff';

    // Transform alliance teams
    match.redAlliance =
      tbaData.alliances?.red?.team_keys?.map((key: string) =>
        parseInt(key.replace('frc', '')),
      ) || [];

    match.blueAlliance =
      tbaData.alliances?.blue?.team_keys?.map((key: string) =>
        parseInt(key.replace('frc', '')),
      ) || [];

    // Set scores
    match.scoreRedFinal = tbaData.alliances?.red?.score;
    match.scoreBlueFinal = tbaData.alliances?.blue?.score;

    // Store detailed score breakdown
    match.scoreBreakdown = tbaData.score_breakdown;

    return match;
  }

  async saveEvent(tbaData: TBAEventType): Promise<TBAEvent> {
    const event = this.transformTBAEvent(tbaData);
    return await this.eventRepository.save(event);
  }

  async saveMatch(tbaData: TBAMatchType): Promise<TBAMatch> {
    const match = this.transformTBAMatch(tbaData);
    return await this.matchRepository.save(match);
  }

  async syncEventData(eventKey: string): Promise<void> {
    try {
      console.log(`Starting sync for event: ${eventKey}`);

      // Sync event info
      console.log('Fetching event details...');
      const eventData = await this.getEventDetails(eventKey);
      await this.saveEvent(eventData);
      console.log(`Saved event: ${eventData.name}`);

      // Sync matches
      console.log('Fetching event matches...');
      const matchesData = await this.getEventMatches(eventKey);
      console.log(`Found ${matchesData.length} matches`);
      for (const matchData of matchesData) {
        await this.saveMatch(matchData);
      }
      console.log(`Saved ${matchesData.length} matches`);

      // Sync teams
      console.log('Fetching event teams...');
      const teamsData = await this.getEventTeams(eventKey);
      console.log(`Found ${teamsData.length} teams`);
      for (const teamData of teamsData) {
        await this.saveTeamData(teamData);
      }
      console.log(`Saved ${teamsData.length} teams`);

      // Upsert ScoutEvent -> EventTeam/EventMatch tables used by /event/:id endpoints
      await this.upsertScoutEventProjections(eventKey);

      console.log(`Successfully completed sync for event: ${eventKey}`);
    } catch (error) {
      console.error(`Error during sync for event ${eventKey}:`, error.message);
      if (error.response) {
        console.error(
          'API Response Error:',
          error.response.status,
          error.response.data,
        );
      }
      throw new HttpException(
        `Failed to sync event ${eventKey}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEventDetails(eventKey: string): Promise<TBAEventType> {
    try {
      const response = await this.httpService
        .get(`/event/${eventKey}`, {
          headers: {
            'X-TBA-Auth-Key': this.apiKey,
            Accept: 'application/json',
          },
        })
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from TBA API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch event ${eventKey}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveTeamData(tbaData: TBATeam): Promise<void> {
    try {
      const teamNumber = tbaData.team_number;
      const teamName = tbaData.name || tbaData.nickname;

      // Check if team already exists
      let team = await this.teamRepository.findOne({
        where: { number: teamNumber },
      });

      if (!team) {
        // Create new team
        team = new Team();
        team.number = teamNumber;
      }

      // Update team information
      team.name = teamName;
      team.lastUpdated = new Date();

      await this.teamRepository.save(team);
      console.log(`Saved/updated team ${teamNumber}: ${teamName}`);
    } catch (error) {
      console.error(
        `Failed to save team data for ${tbaData.team_number}:`,
        error,
      );
      throw error;
    }
  }

  transformTBAEvent(tbaData: TBAEventType): TBAEvent {
    const event = new TBAEvent();
    event.eventKey = tbaData.key;
    event.eventName = tbaData.name;
    event.lastSynced = new Date();
    return event;
  }

  private async upsertScoutEventProjections(eventKey: string): Promise<void> {
    const scoutEvent = await this.scoutEventRepository.findOne({
      where: { tbaEventKey: eventKey },
    });

    if (!scoutEvent) {
      // If no ScoutEvent exists, nothing to project.
      return;
    }

    // Teams: project from Team table based on TBAMatch alliances for this event.
    const tbaMatches = await this.matchRepository.find({
      where: { eventKey },
      order: { matchNumber: 'ASC' },
    });

    const teamNumbers = new Set<number>();
    for (const m of tbaMatches) {
      (m.redAlliance || []).forEach((n) => teamNumbers.add(n));
      (m.blueAlliance || []).forEach((n) => teamNumbers.add(n));
    }

    for (const teamNumber of teamNumbers) {
      const exists = await this.eventTeamRepository.findOne({
        where: { scoutEventId: scoutEvent.id, teamNumber },
      });
      if (exists) continue;

      const et = this.eventTeamRepository.create({
        scoutEventId: scoutEvent.id,
        teamNumber,
        source: EventTeamSource.TBA,
      });
      await this.eventTeamRepository.save(et);
    }

    // Matches: project from TBAMatch
    for (const m of tbaMatches) {
      const matchKey = m.matchKey;
      const exists = await this.eventMatchRepository.findOne({
        where: { scoutEventId: scoutEvent.id, tbaMatchKey: matchKey },
      });
      if (exists) continue;

      const displayName = `${m.matchType} ${m.matchNumber}`;

      const em = this.eventMatchRepository.create({
        scoutEventId: scoutEvent.id,
        source: EventMatchSource.TBA,
        tbaMatchKey: matchKey,
        displayName,
        matchNumber: m.matchNumber,
        compLevel: m.matchType,
      });
      await this.eventMatchRepository.save(em);
    }
  }
}
