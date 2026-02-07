import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.scheme';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel('Like') private likeModel: Model<any>,
    ) { }

    async create(createCommentDto: CreateCommentDto): Promise<Comment> {
        const createdComment = new this.commentModel({
            ...createCommentDto,
            likes_count: 0,
        });
        return createdComment.save();
    }

    async findByPostId(postId: string, currentUserId?: string): Promise<any[]> {
        const comments = await this.commentModel
            .find({ post_id: postId, parent_id: { $exists: false } })
            .sort({ created_at: -1 })
            .lean()
            .exec();

        return this.enrichCommentsWithUserInfo(comments, currentUserId);
    }

    async findReplies(parentId: string, currentUserId?: string): Promise<any[]> {
        const replies = await this.commentModel
            .find({ parent_id: parentId })
            .sort({ created_at: 1 })
            .lean()
            .exec();

        return this.enrichCommentsWithUserInfo(replies, currentUserId);
    }

    async findOne(id: string): Promise<Comment> {
        const comment = await this.commentModel.findById(id).exec();
        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }
        return comment;
    }

    async delete(id: string): Promise<Comment> {
        const deletedComment = await this.commentModel.findByIdAndDelete(id).exec();
        if (!deletedComment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }
        return deletedComment;
    }

    async incrementLikesCount(id: string, increment: number): Promise<void> {
        await this.commentModel
            .findByIdAndUpdate(id, { $inc: { likes_count: increment } })
            .exec();
    }

    async countByPostId(postId: string): Promise<number> {
        return this.commentModel.countDocuments({ post_id: postId }).exec();
    }

    private async enrichCommentsWithUserInfo(comments: any[], currentUserId?: string): Promise<any[]> {
        if (!comments || comments.length === 0) return [];

        // Get unique user IDs
        const userIds = [...new Set(comments.map(comment => comment.user_id))];
        
        // Fetch all users at once
        const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('_id full_name avatar_url')
            .lean()
            .exec();

        const userMap = new Map(users.map(user => [(user as any)._id.toString(), user]));

        // If currentUserId is provided, check which comments the user has liked
        let likedCommentIds = new Set();
        if (currentUserId) {
            const likes = await this.likeModel
                .find({
                    user_id: currentUserId,
                    comment_id: { $in: comments.map(c => c._id.toString()) }
                })
                .lean()
                .exec();
            likedCommentIds = new Set(likes.map(like => like.comment_id));
        }

        // Enrich comments with user info and like status
        return comments.map(comment => {
            const user = userMap.get(comment.user_id);
            return {
                ...comment,
                user_name: user?.full_name || 'Unknown User',
                user_avatar: user?.avatar_url || null,
                is_liked: likedCommentIds.has(comment._id.toString()),
            };
        });
    }
}
