
import { Controller, Get, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleAdmin } from '../users/schemas/user.scheme';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRoleAdmin.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User management endpoints
  @Roles(UserRoleAdmin.ADMIN || UserRoleAdmin.MODERATOR)
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('users/:id/block')
  @HttpCode(HttpStatus.OK)
  async blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('users/:id/unblock')
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Param('id') id: string) {
    return this.adminService.unblockUser(id);
  }
}
