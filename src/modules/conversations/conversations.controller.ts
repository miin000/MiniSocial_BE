
import { Controller, Get } from '@nestjs/common';

@Controller('conversations')
export class ConversationsController {
  @Get()
  findAll(): string {
    return 'This action returns all conversations';
  }
}
