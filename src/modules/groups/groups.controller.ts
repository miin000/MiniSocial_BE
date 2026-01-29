
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleGroup } from '../users/schemas/user.scheme';

@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // UC5.3: Create group
  @Post()
  @Roles(UserRoleGroup.MEMBER)
  createGroup(@Request() req, @Body() body: { name: string; description?: string; avatar_url?: string; cover_url?: string; require_post_approval?: boolean }) {
    return this.groupsService.createGroup(req.user.userId, body);
  }

  // Get all groups (for users)
  @Get()
  @Roles(UserRoleGroup.MEMBER)
  findAll() {
    return this.groupsService.getAllGroups();
  }

  // Get group by id
  @Get(':id')
  @Roles(UserRoleGroup.MEMBER)
  findOne(@Param('id') id: string) {
    return this.groupsService.findGroupById(id);
  }

  // UC5.4: Update group (admin)
  @Put(':id')
  @Roles(UserRoleGroup.ADMIN)
  updateGroup(@Param('id') id: string, @Request() req, @Body() body: Partial<any>) {
    return this.groupsService.updateGroup(id, req.user.userId, body);
  }

  // UC5.5: Delete group (admin)
  @Delete(':id')
  @Roles(UserRoleGroup.ADMIN)
  deleteGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.deleteGroup(id, req.user.userId);
  }

  // UC5.1: Join group
  @Post(':id/join')
  @Roles(UserRoleGroup.MEMBER)
  joinGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.joinGroup(id, req.user.userId);
  }

  // UC5.2: Leave group
  @Post(':id/leave')
  @Roles(UserRoleGroup.MEMBER)
  leaveGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.leaveGroup(id, req.user.userId);
  }

  // UC5.8: Invite member
  @Post(':id/invite')
  @Roles(UserRoleGroup.MEMBER)
  inviteMember(@Param('id') id: string, @Request() req, @Body() body: { user_id: string }) {
    return this.groupsService.inviteMember(id, req.user.userId, body.user_id);
  }

  // UC5.9: Approve member
  @Post(':id/members/:memberId/approve')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  approveMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.approveMember(id, req.user.userId, memberId);
  }

  // UC5.10: Remove member
  @Delete(':id/members/:memberId')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.removeMember(id, req.user.userId, memberId);
  }

  // UC5.11: Get members
  @Get(':id/members')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  getMembers(@Param('id') id: string, @Request() req) {
    return this.groupsService.getMembers(id, req.user.userId);
  }

  // UC5.12: Promote to moderator
  @Post(':id/members/:memberId/promote')
  @Roles(UserRoleGroup.ADMIN)
  promoteToModerator(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.promoteToModerator(id, req.user.userId, memberId);
  }

  // UC5.13: Transfer admin
  @Post(':id/transfer-admin')
  @Roles(UserRoleGroup.ADMIN)
  transferAdmin(@Param('id') id: string, @Request() req, @Body() body: { new_admin_id: string }) {
    return this.groupsService.transferAdmin(id, req.user.userId, body.new_admin_id);
  }

  // Create group post
  @Post(':id/posts')
  @Roles(UserRoleGroup.MEMBER)
  createPost(@Param('id') id: string, @Request() req, @Body() body: { content: string; media_url?: string; content_type?: string }) {
    return this.groupsService.createGroupPost(id, req.user.userId, body);
  }

  // UC5.6: Approve post
  @Post(':id/posts/:postId/approve')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  approvePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req) {
    return this.groupsService.approvePost(id, req.user.userId, postId);
  }

  // UC5.7: Delete post
  @Delete(':id/posts/:postId')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  deletePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req) {
    return this.groupsService.deletePost(id, req.user.userId, postId);
  }

  // Get group posts
  @Get(':id/posts')
  @Roles(UserRoleGroup.MEMBER)
  getPosts(@Param('id') id: string) {
    return this.groupsService.getGroupPosts(id);
  }

  // UC5.12: Get all posts (mod/admin)
  @Get(':id/posts/all')
  @Roles(UserRoleGroup.MODERATOR, UserRoleGroup.ADMIN)
  getAllPosts(@Param('id') id: string, @Request() req) {
    return this.groupsService.getPosts(id, req.user.userId);
  }
}
