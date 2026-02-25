import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.scheme';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UserSchema } from '../users/schemas/user.scheme';
import { LikeSchema } from '../likes/schemas/like.scheme';
import { FriendSchema } from '../friends/schemas/friend.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Like', schema: LikeSchema },
      { name: 'Friend', schema: FriendSchema },
    ])
  ],

  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
