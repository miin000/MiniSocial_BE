
import { Controller, Get } from '@nestjs/common';

@Controller('friends')
export class FriendsController {
  @Get()
  findAll(): string {
    return 'This action returns all friends';
  }
}
