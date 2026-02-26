import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeSchema } from './schemas/like.scheme';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.scheme';
import { UserSchema } from '../users/schemas/user.scheme';
import { PostSchema } from '../posts/schemas/post.scheme';
import { CommentSchema } from '../comments/schemas/comment.scheme';
import { FirebaseService } from '../../common/services/firebase.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Like', schema: LikeSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Post', schema: PostSchema },
      { name: 'Comment', schema: CommentSchema },
    ]),
    PostsModule,
    CommentsModule,
  ],

  controllers: [LikesController],
  providers: [LikesService, FirebaseService],
  exports: [LikesService],
})
export class LikesModule {}
