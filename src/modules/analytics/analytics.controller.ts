
import { Controller, Get } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  @Get()
  findAll(): string {
    return 'This action returns all analytics';
  }
}
