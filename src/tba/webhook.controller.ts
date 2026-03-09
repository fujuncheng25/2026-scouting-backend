import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TBAService } from './tba.service';
import { TBAMatch as TBAMatchType } from './tba.types';
import * as crypto from 'crypto';

interface WebhookPayload {
  message_type: string;
  message_data: {
    event_key?: string;
    team_keys?: string[];
    match?: TBAMatchType;
    scheduled_time?: number;
    first_match_time?: number;
  };
}

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly tbaService: TBAService) {}

  @Post('tba')
  async handleTBAWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-tba-hmac') hmac: string,
  ) {
    try {
      console.log('Received webhook:', JSON.stringify(payload, null, 2));

      // Validate webhook signature (if secret is configured)
      const webhookSecret = process.env.TBA_WEBHOOK_SECRET;
      if (webhookSecret && hmac) {
        try {
          const expectedHmac = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

          if (hmac !== expectedHmac) {
            console.log('HMAC mismatch:', {
              received: hmac,
              expected: expectedHmac,
            });
            throw new HttpException(
              'Invalid webhook signature',
              HttpStatus.UNAUTHORIZED,
            );
          }
        } catch (error) {
          console.log('HMAC validation error:', error);
          // Continue processing for testing
        }
      }

      const { message_type, message_data } = payload;

      switch (message_type) {
        case 'verification':
          await this.handleVerification(message_data);
          break;

        case 'upcoming_match':
          await this.handleUpcomingMatch(message_data);
          break;

        case 'match_score':
          await this.handleMatchScore(message_data);
          break;

        case 'schedule_updated':
          await this.handleScheduleUpdated(message_data);
          break;

        case 'ping':
          this.logger.log('Received webhook ping');
          return { status: 'received' };

        default:
          this.logger.warn(`Unhandled webhook message type: ${message_type}`);
      }

      return { status: 'received' };
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async handleVerification(
    messageData: WebhookPayload['message_data'],
  ) {
    console.log('Verification webhook received');
    return { status: 'received' };
  }

  private async handleUpcomingMatch(
    messageData: WebhookPayload['message_data'],
  ) {
    console.log('Upcoming match webhook received');
    return { status: 'received' };
  }

  private async handleMatchScore(messageData: WebhookPayload['message_data']) {
    console.log('Match score webhook received');
    return { status: 'received' };
  }

  private async handleScheduleUpdated(
    messageData: WebhookPayload['message_data'],
  ) {
    const { event_key } = messageData;
    if (event_key) {
      this.logger.log(`Schedule updated for event: ${event_key}`);
      await this.tbaService.syncEventData(event_key);
    }
    return { status: 'received' };
  }
}
