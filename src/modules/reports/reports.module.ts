
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.scheme';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Post, PostSchema } from '../posts/schemas/post.scheme';
import { User, UserSchema } from '../users/schemas/user.scheme';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ])
  ],

  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
