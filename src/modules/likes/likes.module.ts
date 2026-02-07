import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeSchema } from './schemas/like.scheme';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Like', schema:  LikeSchema },
    ]),
    PostsModule,
    CommentsModule,
  ],

  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
