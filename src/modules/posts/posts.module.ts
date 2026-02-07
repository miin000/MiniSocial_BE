import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema } from './schemas/post.scheme';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UserSchema } from '../users/schemas/user.scheme';
import { LikeSchema } from '../likes/schemas/like.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Like', schema: LikeSchema },
    ])
  ],

  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
