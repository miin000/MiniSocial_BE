
import { Controller, Get, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications - Get current user's notifications
  @Get()
  findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    console.log('[NotifController] req.user:', JSON.stringify(req.user));
    console.log('[NotifController] userId:', req.user.userId, '| sub:', req.user.sub, '| user_id:', req.user.user_id);
    return this.notificationsService.findAllByUser(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  // GET /notifications/unread-count - Get unread notification count
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId).then(count => ({ count }));
  }

  // PUT /notifications/read-all - Mark all notifications as read
  @Put('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  // PUT /notifications/:id/read - Mark single notification as read
  @Put(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  // DELETE /notifications/:id - Delete a notification
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.notificationsService.delete(id, req.user.userId);
  }
}
