
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivityLog } from './schemas/user-activity-log.schema';
import { SystemLogs } from './schemas/system-logs.schema';
import { SystemSettings } from './schemas/system-settings.schema';
import { UsersService } from '../users/users.service';
import { Group } from '../groups/schemas/group.scheme';
import { GroupMember } from '../groups/schemas/group-member.scheme';
import { Post, PostStatus } from '../posts/schemas/post.scheme';
import { User, UserRoleAdmin } from '../users/schemas/user.scheme';
import { Report, ReportStatus } from '../reports/schemas/report.scheme';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(SystemLogs.name) private systemLogsModel: Model<SystemLogs>,
        @InjectModel(SystemSettings.name) private systemSettingsModel: Model<SystemSettings>,
        @InjectModel(UserActivityLog.name) private userActivityLogModel: Model<UserActivityLog>,
        @InjectModel(Group.name) private groupModel: Model<Group>,
        @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMember>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Report.name) private reportModel: Model<Report>,
        private usersService: UsersService,
    ) { }

    // User management methods
    async getAllUsers() {
        return this.usersService.findAll();
    }

    async deleteUser(id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }

    // Block/Unblock user methods
    async blockUser(id: string) {
        return this.usersService.blockUser(id);
    }

    async unblockUser(id: string) {
        return this.usersService.unblockUser(id);
    }

    // Group management methods for admin
    async getAllGroups(): Promise<Group[]> {
        return this.groupModel.find();
    }

    async getGroupDetails(groupId: string): Promise<any> {
        const group = await this.groupModel.findById(groupId);
        const members = await this.groupMemberModel.find({ group_id: groupId });
        const posts = await this.postModel.find({ group_id: groupId });

        return { group, members, posts };
    }

    async toggleGroupStatus(groupId: string, status: 'active' | 'blocked'): Promise<Group> {
        const updatedGroup = await this.groupModel.findByIdAndUpdate(groupId, { status }, { new: true });
        if (!updatedGroup) throw new Error('Group not found');
        return updatedGroup;
    }

    // ============ Admin Account Management ============

    // Get all admin accounts (roles_admin != NONE)
    async getAdminAccounts() {
        return this.userModel.find({
            roles_admin: { $in: [UserRoleAdmin.ADMIN, UserRoleAdmin.MODERATOR, UserRoleAdmin.VIEWER] }
        }).select('-password').exec();
    }

    // Add admin role to a user account
    async addAdminAccount(userId: string, role: UserRoleAdmin) {
        if (role === UserRoleAdmin.NONE) {
            throw new Error('Cannot assign NONE role. Use removeAdminAccount instead.');
        }
        if (role === UserRoleAdmin.ADMIN) {
            throw new Error('Cannot assign ADMIN role through this endpoint.');
        }

        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: { roles_admin: [role] } },
            { new: true }
        ).select('-password').exec();

        if (!user) throw new Error('User not found');
        return user;
    }

    // Update admin role of a user account
    async updateAdminAccount(userId: string, role: UserRoleAdmin) {
        if (role === UserRoleAdmin.NONE) {
            throw new Error('Cannot assign NONE role. Use removeAdminAccount instead.');
        }
        if (role === UserRoleAdmin.ADMIN) {
            throw new Error('Cannot change role to ADMIN through this endpoint.');
        }

        const user = await this.userModel.findById(userId).select('-password').exec();
        if (!user) throw new Error('User not found');

        // Cannot change ADMIN role
        if (user.roles_admin?.includes(UserRoleAdmin.ADMIN)) {
            throw new Error('Cannot modify ADMIN account role.');
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: { roles_admin: [role] } },
            { new: true }
        ).select('-password').exec();

        return updatedUser;
    }

    // Remove admin role (set to NONE)
    async removeAdminAccount(userId: string) {
        const user = await this.userModel.findById(userId).select('-password').exec();
        if (!user) throw new Error('User not found');

        // Cannot remove ADMIN role
        if (user.roles_admin?.includes(UserRoleAdmin.ADMIN)) {
            throw new Error('Cannot remove ADMIN account.');
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: { roles_admin: [UserRoleAdmin.NONE] } },
            { new: true }
        ).select('-password').exec();

        return updatedUser;
    }

    // Search users to add as admin (exclude already admin users)
    async searchUsersForAdmin(query: string) {
        const filter: any = {
            roles_admin: { $nin: [UserRoleAdmin.ADMIN, UserRoleAdmin.MODERATOR, UserRoleAdmin.VIEWER] }
        };

        if (query) {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { full_name: { $regex: query, $options: 'i' } },
            ];
        }

        return this.userModel.find(filter).select('-password').limit(20).exec();
    }

    // ============ Post Management ============

    async getAllPosts(page = 1, limit = 20, status?: string, search?: string): Promise<{ posts: any[]; total: number }> {
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        } else {
            // Exclude deleted posts by default
            query.status = { $ne: PostStatus.DELETED };
        }

        if (search) {
            query.$or = [
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await this.postModel.countDocuments(query);
        const posts = await this.postModel
            .find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        // Enrich with user info
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('_id full_name username avatar_url')
            .lean()
            .exec();
        const userMap = new Map(users.map(u => [(u as any)._id.toString(), u]));

        // Count reports per post
        const postIds = posts.map(p => (p as any)._id.toString());
        const reportCounts = await this.reportModel.aggregate([
            { $match: { reported_post_id: { $in: postIds } } },
            { $group: { _id: '$reported_post_id', count: { $sum: 1 } } },
        ]);
        const reportCountMap = new Map(reportCounts.map(r => [r._id, r.count]));

        const enriched = posts.map(post => {
            const user = userMap.get(post.user_id);
            return {
                ...post,
                user_name: (user as any)?.full_name || (user as any)?.username || 'Unknown',
                username: (user as any)?.username || null,
                user_avatar: (user as any)?.avatar_url || null,
                report_count: reportCountMap.get((post as any)._id.toString()) || 0,
            };
        });

        return { posts: enriched, total };
    }

    async getPostById(id: string): Promise<any> {
        const post = await this.postModel.findById(id).lean().exec();
        if (!post) throw new NotFoundException('Post not found');

        const user = await this.userModel
            .findById(post.user_id)
            .select('_id full_name username avatar_url')
            .lean()
            .exec();

        const reports = await this.reportModel
            .find({ reported_post_id: id })
            .sort({ created_at: -1 })
            .exec();

        return {
            ...post,
            user_name: (user as any)?.full_name || (user as any)?.username || 'Unknown',
            username: (user as any)?.username || null,
            user_avatar: (user as any)?.avatar_url || null,
            reports,
        };
    }

    async hidePost(id: string): Promise<any> {
        const post = await this.postModel.findByIdAndUpdate(id, { status: 'hidden' }, { new: true }).exec();
        if (!post) throw new NotFoundException('Post not found');
        return { message: 'Post hidden successfully', post };
    }

    async showPost(id: string): Promise<any> {
        const post = await this.postModel.findByIdAndUpdate(id, { status: PostStatus.ACTIVE }, { new: true }).exec();
        if (!post) throw new NotFoundException('Post not found');
        return { message: 'Post shown successfully', post };
    }

    async deletePost(id: string): Promise<any> {
        const post = await this.postModel.findByIdAndUpdate(id, { status: PostStatus.DELETED }, { new: true }).exec();
        if (!post) throw new NotFoundException('Post not found');
        return { message: 'Post deleted successfully' };
    }

    // ============ Report Management ============

    async getAllReports(page = 1, limit = 20, status?: string): Promise<{ reports: any[]; total: number }> {
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const total = await this.reportModel.countDocuments(query);
        const reports = await this.reportModel
            .find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        // Enrich
        const userIds = new Set<string>();
        const postIds = new Set<string>();
        for (const r of reports) {
            if (r.reporter_id) userIds.add(r.reporter_id);
            if (r.reported_id) userIds.add(r.reported_id);
            if (r.resolved_by) userIds.add(r.resolved_by);
            if (r.reported_post_id) postIds.add(r.reported_post_id);
        }

        const users = await this.userModel
            .find({ _id: { $in: Array.from(userIds) } })
            .select('_id full_name username avatar_url')
            .lean()
            .exec();
        const posts = await this.postModel
            .find({ _id: { $in: Array.from(postIds) } })
            .lean()
            .exec();

        const userMap = new Map(users.map(u => [(u as any)._id.toString(), u]));
        const postMap = new Map(posts.map(p => [(p as any)._id.toString(), p]));

        // Get post author info
        const postUserIds = new Set<string>();
        for (const p of posts) {
            if (p.user_id) postUserIds.add(p.user_id);
        }
        const postUsers = await this.userModel
            .find({ _id: { $in: Array.from(postUserIds) } })
            .select('_id full_name username avatar_url')
            .lean()
            .exec();
        const postUserMap = new Map(postUsers.map(u => [(u as any)._id.toString(), u]));

        const enriched = reports.map(r => {
            const reporter = userMap.get(r.reporter_id);
            const reported = userMap.get(r.reported_id);
            const post = postMap.get(r.reported_post_id);
            const postAuthor = post ? postUserMap.get(post.user_id) : null;
            const resolver = r.resolved_by ? userMap.get(r.resolved_by) : null;

            return {
                ...r,
                reporter_info: reporter ? {
                    _id: (reporter as any)._id,
                    username: (reporter as any).username,
                    full_name: (reporter as any).full_name,
                    avatar_url: (reporter as any).avatar_url,
                } : null,
                reported_user_info: reported ? {
                    _id: (reported as any)._id,
                    username: (reported as any).username,
                    full_name: (reported as any).full_name,
                } : null,
                post_info: post ? {
                    _id: (post as any)._id,
                    content: post.content,
                    media_urls: post.media_urls,
                    status: post.status,
                    user_id: post.user_id,
                    author_name: (postAuthor as any)?.full_name || (postAuthor as any)?.username || 'Unknown',
                    author_username: (postAuthor as any)?.username,
                } : null,
                resolver_info: resolver ? {
                    _id: (resolver as any)._id,
                    username: (resolver as any).username,
                    full_name: (resolver as any).full_name,
                } : null,
            };
        });

        return { reports: enriched, total };
    }

    async getReportStats(): Promise<any> {
        const total = await this.reportModel.countDocuments();
        const pending = await this.reportModel.countDocuments({ status: ReportStatus.PENDING });
        const resolved = await this.reportModel.countDocuments({ status: ReportStatus.RESOLVED });
        const rejected = await this.reportModel.countDocuments({ status: ReportStatus.REJECTED });
        return { total, pending, resolved, rejected };
    }

    async getReportById(id: string): Promise<any> {
        const report = await this.reportModel.findById(id).lean().exec();
        if (!report) throw new NotFoundException('Report not found');

        const reporter = await this.userModel.findById(report.reporter_id).select('_id full_name username avatar_url').lean().exec();
        const reported = report.reported_id ? await this.userModel.findById(report.reported_id).select('_id full_name username avatar_url').lean().exec() : null;
        const post = report.reported_post_id ? await this.postModel.findById(report.reported_post_id).lean().exec() : null;
        let postAuthor: any = null;
        if (post) {
            postAuthor = await this.userModel.findById(post.user_id).select('_id full_name username').lean().exec();
        }

        return {
            ...report,
            reporter_info: reporter,
            reported_user_info: reported,
            post_info: post ? { ...post, author_name: (postAuthor as any)?.full_name || (postAuthor as any)?.username } : null,
        };
    }

    async resolveReport(id: string, resolvedBy: string, body: { resolved_note: string; action_taken?: string }): Promise<any> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) throw new NotFoundException('Report not found');

        report.status = ReportStatus.RESOLVED;
        report.resolved_at = new Date();
        report.resolved_by = resolvedBy;
        report.resolved_note = body.resolved_note;
        report.action_taken = body.action_taken || 'none';

        // Apply action
        if (body.action_taken === 'remove_post' && report.reported_post_id) {
            await this.postModel.findByIdAndUpdate(report.reported_post_id, { status: PostStatus.DELETED });
        } else if (body.action_taken === 'hide_post' && report.reported_post_id) {
            await this.postModel.findByIdAndUpdate(report.reported_post_id, { status: 'hidden' });
        } else if (body.action_taken === 'ban_user') {
            const targetId = report.reported_id;
            if (targetId) {
                await this.userModel.findByIdAndUpdate(targetId, { status: 'BLOCKED' });
            } else if (report.reported_post_id) {
                const post = await this.postModel.findById(report.reported_post_id).exec();
                if (post) {
                    await this.userModel.findByIdAndUpdate(post.user_id, { status: 'BLOCKED' });
                }
            }
        }

        await report.save();
        return { message: 'Report resolved successfully', report };
    }

    async rejectReport(id: string, resolvedBy: string, body: { resolved_note: string }): Promise<any> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) throw new NotFoundException('Report not found');

        report.status = ReportStatus.REJECTED;
        report.resolved_at = new Date();
        report.resolved_by = resolvedBy;
        report.resolved_note = body.resolved_note;
        report.action_taken = 'none';

        await report.save();
        return { message: 'Report rejected', report };
    }
}
