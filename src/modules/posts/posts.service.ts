import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.scheme';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel('Like') private likeModel: Model<any>,
    ) { }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        const createdPost = new this.postModel({
            ...createPostDto,
            status: 'active',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
        });
        return createdPost.save();
    }

    async findAll(page: number = 1, limit: number = 20, currentUserId?: string): Promise<{ posts: any[], total: number }> {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.postModel
                .find({ status: 'active' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.postModel.countDocuments({ status: 'active' })
        ]);

        // Enrich with user info and like status
        const enrichedPosts = await this.enrichPostsWithUserInfo(posts, currentUserId);
        return { posts: enrichedPosts, total };
    }

    async findOne(id: string, currentUserId?: string): Promise<any> {
        const post = await this.postModel.findById(id).lean().exec();
        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }
        
        const enrichedPosts = await this.enrichPostsWithUserInfo([post], currentUserId);
        return enrichedPosts[0];
    }

    async findByUserId(userId: string, page: number = 1, limit: number = 20, currentUserId?: string): Promise<{ posts: any[], total: number }> {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.postModel
                .find({ user_id: userId, status: 'active' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.postModel.countDocuments({ user_id: userId, status: 'active' })
        ]);

        const enrichedPosts = await this.enrichPostsWithUserInfo(posts, currentUserId);
        return { posts: enrichedPosts, total };
    }

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
        const updatedPost = await this.postModel
            .findByIdAndUpdate(id, updatePostDto, { new: true })
            .exec();
        if (!updatedPost) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }
        return updatedPost;
    }

    async delete(id: string): Promise<Post> {
        const deletedPost = await this.postModel
            .findByIdAndUpdate(id, { status: 'deleted' }, { new: true })
            .exec();
        if (!deletedPost) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }
        return deletedPost;
    }

    async incrementLikesCount(id: string, increment: number): Promise<void> {
        await this.postModel
            .findByIdAndUpdate(id, { $inc: { likes_count: increment } })
            .exec();
    }

    async incrementCommentsCount(id: string, increment: number): Promise<void> {
        await this.postModel
            .findByIdAndUpdate(id, { $inc: { comments_count: increment } })
            .exec();
    }

    private async enrichPostsWithUserInfo(posts: any[], currentUserId?: string): Promise<any[]> {
        if (!posts || posts.length === 0) return [];

        // Get unique user IDs
        const userIds = [...new Set(posts.map(post => post.user_id))];
        
        // Fetch all users at once
        const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('_id full_name avatar_url')
            .lean()
            .exec();

        const userMap = new Map(users.map(user => [user._id.toString(), user]));

        // If currentUserId is provided, check which posts the user has liked
        let likedPostIds = new Set();
        if (currentUserId) {
            const likes = await this.likeModel
                .find({
                    user_id: currentUserId,
                    post_id: { $in: posts.map(p => p._id.toString()) }
                })
                .lean()
                .exec();
            likedPostIds = new Set(likes.map(like => like.post_id));
        }

        // Enrich posts with user info and like status
        return posts.map(post => {
            const user = userMap.get(post.user_id);
            return {
                ...post,
                user_name: user?.full_name || 'Unknown User',
                user_avatar: user?.avatar_url || null,
                is_liked: likedPostIds.has(post._id.toString()),
            };
        });
    }
}
