import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from './schemas/like.scheme';
import { CreateLikeDto } from './dto/create-like.dto';
import { Notification } from '../notifications/schemas/notification.scheme';
import { FirebaseService } from '../../common/services/firebase.service';

@Injectable()
export class LikesService {
    constructor(
        @InjectModel(Like.name) private likeModel: Model<Like>,
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel('Post') private postModel: Model<any>,
        @InjectModel('Comment') private commentModel: Model<any>,
        private readonly firebaseService: FirebaseService,
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

            // Send notification to post/comment owner
            await this.sendLikeNotification(createLikeDto);

            return { liked: true, like: savedLike };
        }
    }

    private async sendLikeNotification(dto: CreateLikeDto) {
        try {
            const sender: any = await this.userModel.findById(dto.user_id).select('full_name username').lean().exec();
            const senderName = sender?.full_name || sender?.username || 'Ai đó';
            let ownerId: string | null = null;
            let refId: string | undefined;
            let refType: string | undefined;
            let content = '';

            if (dto.post_id) {
                const post: any = await this.postModel.findById(dto.post_id).select('user_id').lean().exec();
                ownerId = post?.user_id;
                refId = dto.post_id;
                refType = 'post';
                content = `${senderName} đã thích bài viết của bạn.`;
            } else if (dto.comment_id) {
                const comment: any = await this.commentModel.findById(dto.comment_id).select('user_id').lean().exec();
                ownerId = comment?.user_id;
                refId = dto.comment_id;
                refType = 'comment';
                content = `${senderName} đã thích bình luận của bạn.`;
            }

            if (ownerId && ownerId !== dto.user_id) {
                const saved = await this.notificationModel.create({
                    user_id: ownerId,
                    sender_id: dto.user_id,
                    type: 'like',
                    content,
                    ref_id: refId,
                    ref_type: refType,
                    is_read: false,
                });
                await this.firebaseService.writeNotification({
                    user_id: ownerId, sender_id: dto.user_id,
                    type: 'like', content, ref_id: refId, ref_type: refType,
                    mongo_id: saved._id.toString(),
                });
            }
        } catch (e) {
            // Don't fail the like operation if notification fails
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
