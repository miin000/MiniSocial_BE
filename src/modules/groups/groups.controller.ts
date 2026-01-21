
import { Controller, Get } from '@nestjs/common';

@Controller('groups')
export class GroupsController {
  @Get()
  findAll(): string {
    return 'This action returns all groups';
  }
}
