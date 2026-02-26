
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendSchema } from './schemas/friend.scheme';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { UsersModule } from '../users/users.module';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.scheme';
import { FirebaseService } from '../../common/services/firebase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Friend', schema: FriendSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    UsersModule,
  ],

  controllers: [FriendsController],
  providers: [FriendsService, FirebaseService],
  exports: [FriendsService],
})
export class FriendsModule {}
