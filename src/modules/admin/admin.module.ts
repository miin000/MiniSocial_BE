import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemLogs, SystemLogsSchema } from './schemas/system-logs.schema';
import { SystemSettings, SystemSettingsSchema } from './schemas/system-settings.schema';
import { UserActivityLog, UserActivityLogSchema } from './schemas/user-activity-log.schema';
import { Group, GroupSchema } from '../groups/schemas/group.scheme';
import { GroupMember, GroupMemberSchema } from '../groups/schemas/group-member.scheme';
import { GroupPost, GroupPostSchema } from '../groups/schemas/group-post.scheme';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLogs.name, schema: SystemLogsSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
      { name: UserActivityLog.name, schema: UserActivityLogSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: GroupPost.name, schema: GroupPostSchema },
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
