import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

@Controller('likes')
export class LikesController {
  constructor(
    private readonly likesService: LikesService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) { }

  @Post('toggle')
  async toggleLike(@Body() createLikeDto: CreateLikeDto) {
    const result = await this.likesService.toggleLike(createLikeDto);
    
    // Update likes count
    if (createLikeDto.post_id) {
      await this.postsService.incrementLikesCount(
        createLikeDto.post_id,
        result.liked ? 1 : -1
      );
    } else if (createLikeDto.comment_id) {
      await this.commentsService.incrementLikesCount(
        createLikeDto.comment_id,
        result.liked ? 1 : -1
      );
    }
    
    return result;
  }

  @Get('check')
  checkLike(
    @Query('user_id') userId: string,
    @Query('post_id') postId?: string,
    @Query('comment_id') commentId?: string,
  ) {
    return this.likesService.checkLike(userId, postId, commentId);
  }

  @Get('post/:postId')
  getLikesByPost(@Query('postId') postId: string) {
    return this.likesService.getLikesByPost(postId);
  }

  @Get('comment/:commentId')
  getLikesByComment(@Query('commentId') commentId: string) {
    return this.likesService.getLikesByComment(commentId);
  }
}
