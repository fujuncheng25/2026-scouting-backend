import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoutEvent } from './scout-event.entity';
import { EventMatch } from './event-match.entity';
import { EventTeam } from './event-team.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScoutEvent, EventMatch, EventTeam])],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
