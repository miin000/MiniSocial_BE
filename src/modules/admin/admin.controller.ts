
import { Controller, Get, Put, Post, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
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
  @Roles(UserRoleAdmin.ADMIN, UserRoleAdmin.MODERATOR)
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

  // Group management endpoints
  @Roles(UserRoleAdmin.ADMIN)
  @Get('groups')
  async getAllGroups() {
    return this.adminService.getAllGroups();
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Get('groups/:id/details')
  async getGroupDetails(@Param('id') id: string) {
    return this.adminService.getGroupDetails(id);
  }

  @Roles(UserRoleAdmin.ADMIN)
  @Put('groups/:id/status')
  async toggleGroupStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'blocked' }) {
    return this.adminService.toggleGroupStatus(id, body.status);
  }

  // ============ Admin Account Management ============

  // Get all admin accounts (admin, moderator, viewer)
  @Roles(UserRoleAdmin.ADMIN)
  @Get('accounts')
  async getAdminAccounts() {
    return this.adminService.getAdminAccounts();
  }

  // Search users to add as admin account
  @Roles(UserRoleAdmin.ADMIN)
  @Get('accounts/search')
  async searchUsersForAdmin(@Query('q') query: string) {
    return this.adminService.searchUsersForAdmin(query);
  }

  // Add a user as moderator/viewer
  @Roles(UserRoleAdmin.ADMIN)
  @Post('accounts/:id')
  async addAdminAccount(
    @Param('id') id: string,
    @Body() body: { role: UserRoleAdmin },
  ) {
    return this.adminService.addAdminAccount(id, body.role);
  }

  // Update admin account role
  @Roles(UserRoleAdmin.ADMIN)
  @Put('accounts/:id')
  async updateAdminAccount(
    @Param('id') id: string,
    @Body() body: { role: UserRoleAdmin },
  ) {
    return this.adminService.updateAdminAccount(id, body.role);
  }

  // Remove admin account (set role to NONE)
  @Roles(UserRoleAdmin.ADMIN)
  @Delete('accounts/:id')
  @HttpCode(HttpStatus.OK)
  async removeAdminAccount(@Param('id') id: string) {
    return this.adminService.removeAdminAccount(id);
  }
}
