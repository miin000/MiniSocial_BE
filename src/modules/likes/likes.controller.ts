
import { Controller, Get } from '@nestjs/common';

@Controller('likes')
export class LikesController {
  @Get()
  findAll(): string {
    return 'This action returns all likes';
  }
}
