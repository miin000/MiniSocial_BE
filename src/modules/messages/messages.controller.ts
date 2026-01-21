
import { Controller, Get } from '@nestjs/common';

@Controller('messages')
export class MessagesController {
  @Get()
  findAll(): string {
    return 'This action returns all messages';
  }
}
