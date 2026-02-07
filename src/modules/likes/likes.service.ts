import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from './schemas/like.scheme';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikesService {
    constructor(
        @InjectModel(Like.name) private likeModel: Model<Like>,
    ) { }

    async toggleLike(createLikeDto: CreateLikeDto): Promise<{ liked: boolean, like?: Like }> {
        const query: any = { user_id: createLikeDto.user_id };
        if (createLikeDto.post_id) {
            query.post_id = createLikeDto.post_id;
        }
        if (createLikeDto.comment_id) {
            query.comment_id = createLikeDto.comment_id;
        }

        const existingLike = await this.likeModel.findOne(query).exec();

        if (existingLike) {
            // Unlike
            await this.likeModel.findByIdAndDelete(existingLike._id).exec();
            return { liked: false };
        } else {
            // Like
            const newLike = new this.likeModel(createLikeDto);
            const savedLike = await newLike.save();
            return { liked: true, like: savedLike };
        }
    }

    async checkLike(userId: string, postId?: string, commentId?: string): Promise<boolean> {
        const query: any = { user_id: userId };
        if (postId) {
            query.post_id = postId;
        }
        if (commentId) {
            query.comment_id = commentId;
        }

        const like = await this.likeModel.findOne(query).exec();
        return !!like;
    }

    async getLikesByPost(postId: string): Promise<Like[]> {
        return this.likeModel.find({ post_id: postId }).exec();
    }

    async getLikesByComment(commentId: string): Promise<Like[]> {
        return this.likeModel.find({ comment_id: commentId }).exec();
    }
}
