
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // UC5.3: Create group
  @Post()
  createGroup(@Request() req, @Body() body: { name: string; description?: string; avatar_url?: string; cover_url?: string; require_post_approval?: boolean }) {
    return this.groupsService.createGroup(req.user.userId, body);
  }

  // Get all groups (for users)
  @Get()
  findAll() {
    return this.groupsService.getAllGroups();
  }

  // Get group by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findGroupById(id);
  }

  // UC5.4: Update group (admin)
  @Put(':id')
  updateGroup(@Param('id') id: string, @Request() req, @Body() body: Partial<any>) {
    return this.groupsService.updateGroup(id, req.user.userId, body);
  }

  // UC5.5: Delete group (admin)
  @Delete(':id')
  deleteGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.deleteGroup(id, req.user.userId);
  }

  // UC5.1: Join group
  @Post(':id/join')
  joinGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.joinGroup(id, req.user.userId);
  }

  // UC5.2: Leave group
  @Post(':id/leave')
  leaveGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.leaveGroup(id, req.user.userId);
  }

  // UC5.8: Invite member
  @Post(':id/invite')
  inviteMember(@Param('id') id: string, @Request() req, @Body() body: { user_id: string }) {
    return this.groupsService.inviteMember(id, req.user.userId, body.user_id);
  }

  // UC5.9: Approve member
  @Post(':id/members/:memberId/approve')
  approveMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.approveMember(id, req.user.userId, memberId);
  }

  // UC5.10: Remove member
  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.removeMember(id, req.user.userId, memberId);
  }

  // UC5.11: Get members
  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req) {
    return this.groupsService.getMembers(id, req.user.userId);
  }

  // UC5.12: Promote to moderator
  @Post(':id/members/:memberId/promote')
  promoteToModerator(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.groupsService.promoteToModerator(id, req.user.userId, memberId);
  }

  // UC5.13: Transfer admin
  @Post(':id/transfer-admin')
  transferAdmin(@Param('id') id: string, @Request() req, @Body() body: { new_admin_id: string }) {
    return this.groupsService.transferAdmin(id, req.user.userId, body.new_admin_id);
  }

  // Create group post
  @Post(':id/posts')
  createPost(@Param('id') id: string, @Request() req, @Body() body: { content: string; media_url?: string; content_type?: string }) {
    return this.groupsService.createGroupPost(id, req.user.userId, body);
  }

  // UC5.6: Approve post
  @Post(':id/posts/:postId/approve')
  approvePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req) {
    return this.groupsService.approvePost(id, req.user.userId, postId);
  }

  // UC5.7: Delete post
  @Delete(':id/posts/:postId')
  deletePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req) {
    return this.groupsService.deletePost(id, req.user.userId, postId);
  }

  // Get group posts
  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.groupsService.getGroupPosts(id);
  }

  // Admin endpoints
  @Get('admin/all')
  getAllGroupsAdmin() {
    return this.groupsService.getAllGroups();
  }

  @Get('admin/:id/details')
  getGroupDetailsAdmin(@Param('id') id: string) {
    return this.groupsService.getGroupDetails(id);
  }

  @Put('admin/:id/status')
  toggleGroupStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'blocked' }) {
    return this.groupsService.toggleGroupStatus(id, body.status);
  }
}
