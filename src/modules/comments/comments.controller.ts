
import { Controller, Get } from '@nestjs/common';

@Controller('comments')
export class CommentsController {
  @Get()
  findAll(): string {
    return 'This action returns all comments';
  }
}
