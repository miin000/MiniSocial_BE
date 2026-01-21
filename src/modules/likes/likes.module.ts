
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeSchema } from './schemas/like.scheme';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Like', schema:  LikeSchema },
    ])
  ],

  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
