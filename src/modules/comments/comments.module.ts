import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentSchema } from './schemas/comment.scheme';
import { PostsModule } from '../posts/posts.module';
import { UserSchema } from '../users/schemas/user.scheme';
import { LikeSchema } from '../likes/schemas/like.scheme';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.scheme';
import { PostSchema } from '../posts/schemas/post.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Comment', schema: CommentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Like', schema: LikeSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: 'Post', schema: PostSchema },
    ]),
    PostsModule,
  ],

  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
