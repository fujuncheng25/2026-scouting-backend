import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3001,
    };
  }

  @Get('tba-test')
  testTBA() {
    return {
      status: 'ok',
      message: 'TBA module test',
      timestamp: new Date().toISOString(),
    };
  }
}
