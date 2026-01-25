import { Controller, Get, Patch, Post, Request, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Lấy thông tin profile của user hiện tại
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.user_id);
  }

  // Cập nhật thông tin cá nhân
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(req.user.user_id, updateData);
  }

  // Cập nhật preferences
  @UseGuards(AuthGuard('jwt'))
  @Patch('preferences')
  async updatePreferences(@Request() req, @Body() preferencesData: any) {
    const updateData: UpdateUserDto = {
      preferences: {
        email_notifications: preferencesData.email_notifications,
        two_factor_auth: preferencesData.two_factor_auth,
        activity_alerts: preferencesData.activity_alerts,
      }
    };

    return this.usersService.updateUser(req.user.user_id, updateData);
  }
}
