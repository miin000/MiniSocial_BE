
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
  @Get('admin/users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Delete('admin/users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('admin/users/:id/block')
  @HttpCode(HttpStatus.OK)
  async blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('admin/users/:id/unblock')
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Param('id') id: string) {
    return this.adminService.unblockUser(id);
  }

  // Group management endpoints
  @Roles(UserRoleAdmin.ADMIN)
  @Get('admin/groups')
  async getAllGroups() {
    return this.adminService.getAllGroups();
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Get('admin/groups/:id/details')
  async getGroupDetails(@Param('id') id: string) {
    return this.adminService.getGroupDetails(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('groups/:id/status')
  async toggleGroupStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'blocked' }) {
    return this.adminService.toggleGroupStatus(id, body.status);
  }
}
