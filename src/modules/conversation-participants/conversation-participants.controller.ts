
import { Controller, Get } from '@nestjs/common';

@Controller('conversation-participants')
export class ConversationParticipantsController {
  @Get()
  findAll(): string {
    return 'This action returns all conversation participants';
  }
}
