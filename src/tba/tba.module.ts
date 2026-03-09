import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TBAEvent } from './tba-event.entity';
import { TBAMatch } from './tba-match.entity';
import { Team } from '../team/team.entity';
import { ScoutEvent } from '../event/scout-event.entity';
import { EventTeam } from '../event/event-team.entity';
import { EventMatch } from '../event/event-match.entity';
import { TBAService } from './tba.service';
import { TBAController } from './tba.controller';
import { WebhookController } from './webhook.controller';
import { TBATaskService } from './tba-task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBAEvent,
      TBAMatch,
      Team,
      ScoutEvent,
      EventTeam,
      EventMatch,
    ]),
    HttpModule.register({
      baseURL: process.env.TBA_BASE_URL || 'https://www.thebluealliance.com/api/v3',
      timeout: 10000,
    })
  ],
  providers: [TBAService, TBATaskService],
  controllers: [TBAController, WebhookController],
  exports: [TBAService]
})
export class TBAModule {}
