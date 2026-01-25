import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemLogs, SystemLogsSchema } from './schemas/system-logs.schema';
import { SystemSettings, SystemSettingsSchema } from './schemas/system-settings.schema';
import { UserActivityLog, UserActivityLogSchema } from './schemas/user-activity-log.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLogs.name, schema: SystemLogsSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
      { name: UserActivityLog.name, schema: UserActivityLogSchema },
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
