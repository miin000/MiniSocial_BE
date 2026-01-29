
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivityLog } from './schemas/user-activity-log.schema';
import { SystemLogs } from './schemas/system-logs.schema';
import { SystemSettings } from './schemas/system-settings.schema';
import { UsersService } from '../users/users.service';
import { Group } from '../groups/schemas/group.scheme';
import { GroupMember } from '../groups/schemas/group-member.scheme';
import { GroupPost } from '../groups/schemas/group-post.scheme';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(SystemLogs.name) private systemLogsModel: Model<SystemLogs>,
        @InjectModel(SystemSettings.name) private systemSettingsModel: Model<SystemSettings>,
        @InjectModel(UserActivityLog.name) private userActivityLogModel: Model<UserActivityLog>,
        @InjectModel(Group.name) private groupModel: Model<Group>,
        @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMember>,
        @InjectModel(GroupPost.name) private groupPostModel: Model<GroupPost>,
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
        const members = await this.groupMemberModel.find({ group_id: groupId }).populate('user_id');
        const posts = await this.groupPostModel.find({ group_id: groupId }).populate('user_id');

        return { group, members, posts };
    }

    async toggleGroupStatus(groupId: string, status: 'active' | 'blocked'): Promise<Group> {
        const updatedGroup = await this.groupModel.findByIdAndUpdate(groupId, { status }, { new: true });
        if (!updatedGroup) throw new Error('Group not found');
        return updatedGroup;
    }
}
