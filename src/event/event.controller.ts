import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('all')
  async findAll() {
    return this.eventService.findAllEvents();
  }

  @Post('custom')
  async createCustom(@Body() body: { name: string }) {
    return this.eventService.createCustomEvent(body.name);
  }

  @Post('tba')
  async createTba(@Body() body: { name: string; tbaEventKey: string }) {
    return this.eventService.createTbaEvent(body.name, body.tbaEventKey);
  }

  @Get(':eventId/teams')
  @Header('Cache-Control', 'no-store, max-age=0')
  async listTeams(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.eventService.listEventTeams(eventId);
  }

  @Get(':eventId/matches')
  @Header('Cache-Control', 'no-store, max-age=0')
  async listMatches(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.eventService.listEventMatches(eventId);
  }

  @Post(':eventId/teams')
  async addTeam(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Body() body: { teamNumber: number },
  ) {
    return this.eventService.addTeamToEventManual(eventId, body.teamNumber);
  }

  @Post(':eventId/matches')
  async addMatch(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Body() body: { displayName: string; matchNumber?: number },
  ) {
    return this.eventService.addManualMatch(
      eventId,
      body.displayName,
      body.matchNumber,
    );
  }
}
