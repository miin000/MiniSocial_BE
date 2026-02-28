import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostVisibility, PostStatus } from './schemas/post.scheme';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CategoriesService } from '../categories/categories.service';
import { UserInteractionsService } from '../user-interactions/user-interactions.service';
import { InteractionType } from '../user-interactions/schemas/user-interaction.schema';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel('Like') private likeModel: Model<any>,
        @InjectModel('Friend') private friendModel: Model<any>,
        private readonly categoriesService: CategoriesService,
        private readonly userInteractionsService: UserInteractionsService,
    ) { }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        // Validate tags bắt buộc 1–3 tag
        if (!createPostDto.tags || createPostDto.tags.length === 0) {
            throw new BadRequestException('Please select at least 1 topic tag for your post');
        }
        if (createPostDto.tags.length > 3) {
            throw new BadRequestException('You can select at most 3 topic tags');
        }
        const validSlugs = await this.categoriesService.getValidSlugs();
        const invalidTags = createPostDto.tags.filter((t) => !validSlugs.includes(t));
        if (invalidTags.length > 0) {
            throw new BadRequestException(`Invalid tags: ${invalidTags.join(', ')}`);
        }

        const isGroupPost = !!createPostDto.group_id;
        const createdPost = new this.postModel({
            ...createPostDto,
            visibility: createPostDto.visibility || PostVisibility.PUBLIC,
            status: isGroupPost ? PostStatus.PENDING : PostStatus.ACTIVE,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            view_count: 0,
        });
        const saved = await createdPost.save();

        // Cập nhật post_count cho các category
        await this.categoriesService.incrementPostCount(createPostDto.tags);

        return saved;
    }

    // Create group post with auto-approve logic
    async createGroupPost(createPostDto: CreatePostDto, autoApprove: boolean): Promise<Post> {
        const createdPost = new this.postModel({
            ...createPostDto,
            visibility: PostVisibility.PUBLIC, // Group posts are visible to group members
            status: autoApprove ? PostStatus.APPROVED : PostStatus.PENDING,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
        });
        return createdPost.save();
    }

    // Main feed: only non-group posts that are active + respect visibility
    async findAll(page: number = 1, limit: number = 20, currentUserId?: string): Promise<{ posts: any[], total: number }> {
        const skip = (page - 1) * limit;
        
        // Build query: non-group posts, active status
        const query: any = {
            group_id: { $in: [null, undefined, ''] },
            status: PostStatus.ACTIVE,
        };

        // Handle visibility filtering
        if (currentUserId) {
            // Get friend IDs for 'friends' visibility posts
            const friendIds = await this.getFriendIds(currentUserId);
            query.$or = [
                { visibility: PostVisibility.PUBLIC },
                { visibility: PostVisibility.FRIENDS, user_id: { $in: [currentUserId, ...friendIds] } },
                { visibility: PostVisibility.PRIVATE, user_id: currentUserId },
            ];
        } else {
            query.visibility = PostVisibility.PUBLIC;
        }

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.postModel.countDocuments(query)
        ]);

        const enrichedPosts = await this.enrichPostsWithUserInfo(posts, currentUserId);
        return { posts: enrichedPosts, total };
    }

    async findOne(id: string, currentUserId?: string): Promise<any> {
        const post = await this.postModel.findById(id).lean().exec();
        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        // Ghi view interaction cho hệ thống khuyến nghị
        if (currentUserId) {
            await this.userInteractionsService.record({
                user_id: currentUserId,
                post_id: id,
                interaction_type: InteractionType.VIEW,
            });
            // Tăng view_count
            await this.postModel.findByIdAndUpdate(id, { $inc: { view_count: 1 } }).exec();
        }

        const enrichedPosts = await this.enrichPostsWithUserInfo([post], currentUserId);
        return enrichedPosts[0];
    }

    async findByUserId(userId: string, page: number = 1, limit: number = 20, currentUserId?: string): Promise<{ posts: any[], total: number }> {
        const skip = (page - 1) * limit;
        
        // Build visibility-aware query for profile posts
        const query: any = {
            user_id: userId,
            group_id: { $in: [null, undefined, ''] },
            status: PostStatus.ACTIVE,
        };

        if (currentUserId && currentUserId !== userId) {
            const friendIds = await this.getFriendIds(currentUserId);
            const isFriend = friendIds.includes(userId);
            if (isFriend) {
                query.visibility = { $in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS] };
            } else {
                query.visibility = PostVisibility.PUBLIC;
            }
        }
        // If viewing own profile or no currentUserId specified, show all

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.postModel.countDocuments(query)
        ]);

        const enrichedPosts = await this.enrichPostsWithUserInfo(posts, currentUserId);
        return { posts: enrichedPosts, total };
    }

    // Get group posts (approved only)
    async findByGroupId(groupId: string, page: number = 1, limit: number = 20, currentUserId?: string): Promise<{ posts: any[], total: number }> {
        const skip = (page - 1) * limit;
        const query = {
            group_id: groupId,
            status: { $in: [PostStatus.ACTIVE, PostStatus.APPROVED] },
        };

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.postModel.countDocuments(query)
        ]);

        const enrichedPosts = await this.enrichPostsWithUserInfo(posts, currentUserId);
        return { posts: enrichedPosts, total };
    }

    // Get all group posts with optional status filter (for moderators/admins)
    async findAllByGroupId(groupId: string, status?: string, currentUserId?: string): Promise<any[]> {
        const query: any = { group_id: groupId };
        if (status) {
            query.status = status;
        }

        const posts = await this.postModel
            .find(query)
            .sort({ created_at: -1 })
            .lean()
            .exec();

        return this.enrichPostsWithUserInfo(posts, currentUserId);
    }

    // Get pending group posts
    async findPendingByGroupId(groupId: string, currentUserId?: string): Promise<any[]> {
        const posts = await this.postModel
            .find({ group_id: groupId, status: PostStatus.PENDING })
            .sort({ created_at: -1 })
            .lean()
            .exec();

        return this.enrichPostsWithUserInfo(posts, currentUserId);
    }

    // Approve a group post
    async approveGroupPost(postId: string, approverId: string): Promise<Post> {
        const post = await this.postModel
            .findByIdAndUpdate(
                postId,
                {
                    status: PostStatus.APPROVED,
                    approved_by: approverId,
                    approved_at: new Date(),
                },
                { new: true }
            )
            .exec();

        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    // Reject a group post
    async rejectGroupPost(postId: string, reason?: string): Promise<Post> {
        const post = await this.postModel
            .findByIdAndUpdate(
                postId,
                {
                    status: PostStatus.REJECTED,
                    rejected_reason: reason,
                },
                { new: true }
            )
            .exec();

        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
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

    // Delete all posts belonging to a group
    async deleteByGroupId(groupId: string): Promise<void> {
        await this.postModel.deleteMany({ group_id: groupId }).exec();
    }

    // Count pending posts for a group
    async countPendingByGroupId(groupId: string): Promise<number> {
        return this.postModel.countDocuments({ group_id: groupId, status: PostStatus.PENDING }).exec();
    }

    private async getFriendIds(userId: string): Promise<string[]> {
        try {
            const friends = await this.friendModel.find({
                $or: [
                    { user_id_1: userId, status: 'accepted' },
                    { user_id_2: userId, status: 'accepted' },
                ],
            }).lean().exec();

            return friends.map((f: any) => {
                return f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
            });
        } catch {
            return [];
        }
    }

    private async enrichPostsWithUserInfo(posts: any[], currentUserId?: string): Promise<any[]> {
        if (!posts || posts.length === 0) return [];

        const userIds = [...new Set(posts.map(post => post.user_id))];
        
        const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('_id full_name username avatar_url')
            .lean()
            .exec();

        const userMap = new Map(users.map(user => [(user as any)._id.toString(), user]));

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

        return posts.map(post => {
            const user = userMap.get(post.user_id);
            return {
                ...post,
                user_name: (user as any)?.full_name || (user as any)?.username || 'Unknown User',
                username: (user as any)?.username || null,
                user_avatar: (user as any)?.avatar_url || null,
                is_liked: likedPostIds.has(post._id.toString()),
            };
        });
    }
}
