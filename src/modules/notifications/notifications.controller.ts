
import { Controller, Get } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
  @Get()
  findAll(): string {
    return 'This action returns all notifications';
  }
}
