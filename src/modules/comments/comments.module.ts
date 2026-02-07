import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentSchema } from './schemas/comment.scheme';
import { PostsModule } from '../posts/posts.module';
import { UserSchema } from '../users/schemas/user.scheme';
import { LikeSchema } from '../likes/schemas/like.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Comment', schema: CommentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Like', schema: LikeSchema },
    ]),
    PostsModule,
  ],

  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
