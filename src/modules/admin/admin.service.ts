
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivityLog } from './schemas/user-activity-log.schema';
import { SystemLogs } from './schemas/system-logs.schema';
import { SystemSettings } from './schemas/system-settings.schema';
import { UsersService } from '../users/users.service';
import { Group } from '../groups/schemas/group.scheme';
import { GroupMember } from '../groups/schemas/group-member.scheme';
import { Post } from '../posts/schemas/post.scheme';
import { User, UserRoleAdmin } from '../users/schemas/user.scheme';

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
}
