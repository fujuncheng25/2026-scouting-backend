import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TBAService } from './tba.service';

@Controller('tba')
export class TBAController {
  constructor(private readonly tbaService: TBAService) {}

  @Get('test')
  async test() {
    return { message: 'TBA controller is working!' };
  }

  @Get('events')
  async getEvents(@Query('year') year?: string) {
    const eventYear = year ? parseInt(year) : new Date().getFullYear();
    return await this.tbaService.getEvents(eventYear);
  }

  @Get('teams/:eventKey')
  async getEventTeams(@Param('eventKey') eventKey: string) {
    return await this.tbaService.getEventTeams(eventKey);
  }

  @Get('matches/:eventKey')
  async getEventMatches(@Param('eventKey') eventKey: string) {
    const matches = await this.tbaService.getEventMatches(eventKey);
    return matches.map((match) => this.tbaService.transformTBAMatch(match));
  }

  @Get('match/:matchKey')
  async getMatch(@Param('matchKey') matchKey: string) {
    const match = await this.tbaService.getMatch(matchKey);
    return this.tbaService.transformTBAMatch(match);
  }

  @Post('sync/:eventKey')
  async syncEvent(@Param('eventKey') eventKey: string) {
    await this.tbaService.syncEventData(eventKey);
    return { message: `Successfully synced event ${eventKey}` };
  }

  @Post('sync/all')
  async syncAllEvents() {
    // Get current year events
    const currentYear = new Date().getFullYear();
    const events = await this.tbaService.getEvents(currentYear);
    
    const results = [];
    for (const event of events) {
      try {
        await this.tbaService.syncEventData(event.key);
        results.push({ eventKey: event.key, status: 'success' });
      } catch (error) {
        results.push({ 
          eventKey: event.key, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return { 
      message: `Synced ${results.length} events`,
      results 
    };
  }
}
