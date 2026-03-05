import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
<<<<<<< HEAD
import { AdminController } from './admin.controller';
import { SettingsPublicController } from './settings-public.controller';
=======
import { AdminController, PublicSettingsController } from './admin.controller';
>>>>>>> 2b848fd35df6fc54999af63f3e5ba434d821bba4
import { AdminService } from './admin.service';
import { SystemLogs, SystemLogsSchema } from './schemas/system-logs.schema';
import { SystemSettings, SystemSettingsSchema } from './schemas/system-settings.schema';
import { UserActivityLog, UserActivityLogSchema } from './schemas/user-activity-log.schema';
import { Group, GroupSchema } from '../groups/schemas/group.scheme';
import { GroupMember, GroupMemberSchema } from '../groups/schemas/group-member.scheme';
import { Post, PostSchema } from '../posts/schemas/post.scheme';
import { User, UserSchema } from '../users/schemas/user.scheme';
import { Report, ReportSchema } from '../reports/schemas/report.scheme';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FirebaseService } from '../../common/services/firebase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLogs.name, schema: SystemLogsSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
      { name: UserActivityLog.name, schema: UserActivityLogSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    UsersModule,
    forwardRef(() => AuthModule),
    AnalyticsModule,
  ],
<<<<<<< HEAD
  controllers: [AdminController, SettingsPublicController],
=======
  controllers: [AdminController, PublicSettingsController],
>>>>>>> 2b848fd35df6fc54999af63f3e5ba434d821bba4
  providers: [AdminService, FirebaseService],
  exports: [AdminService],
})
export class AdminModule {}
