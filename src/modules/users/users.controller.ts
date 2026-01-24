
import { Controller, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {} // Inject UsersService

  // @Get('me/profile')
  // getProfile(@Request() req) {
  //   return this.usersService.getProfile(req.user.id);
  // }

  
}
