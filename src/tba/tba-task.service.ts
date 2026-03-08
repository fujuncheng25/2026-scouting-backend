import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TBAService } from './tba.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TBATaskService {
  private readonly logger = new Logger(TBATaskService.name);

  constructor(
    private readonly tbaService: TBAService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleScheduledSync() {
    const defaultEventKey = this.configService.get<string>('DEFAULT_EVENT_KEY');

    if (!defaultEventKey) {
      this.logger.warn('No DEFAULT_EVENT_KEY configured, skipping sync');
      return;
    }

    try {
      this.logger.log(`Starting scheduled sync for event: ${defaultEventKey}`);
      await this.tbaService.syncEventData(defaultEventKey);
      this.logger.log(`Successfully synced event: ${defaultEventKey}`);
    } catch (error) {
      this.logger.error(`Failed to sync event ${defaultEventKey}:`, error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleEventListSync() {
    try {
      this.logger.log('Syncing event list for current year');
      const currentYear = new Date().getFullYear();
      const events = await this.tbaService.getEvents(currentYear);
      this.logger.log(`Found ${events.length} events for ${currentYear}`);
    } catch (error) {
      this.logger.error('Failed to sync event list:', error);
    }
  }
}
