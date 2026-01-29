
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from './schemas/group.scheme';
import { GroupMember } from './schemas/group-member.scheme';
import { GroupPost } from './schemas/group-post.scheme';

@Injectable()
export class GroupsService {
    constructor(
        @InjectModel(Group.name) private groupModel: Model<Group>,
        @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMember>,
        @InjectModel(GroupPost.name) private groupPostModel: Model<GroupPost>,
    ) { }

    async findGroupById(id: string): Promise<Group | null> {
        return this.groupModel.findById(id);
    }

    async getAllGroups(): Promise<Group[]> {
        return this.groupModel.find({ status: 'ACTIVE' });
    }

    // UC5.3: Create group
    async createGroup(creatorId: string, groupData: Partial<Group>): Promise<Group> {
        const group = new this.groupModel({ ...groupData, creator_id: creatorId });
        const savedGroup = await group.save();

        // Add creator as admin member
        await this.groupMemberModel.create({
            group_id: savedGroup._id.toString(),
            user_id: creatorId,
            role: 'ADMIN',
            status: 'ACTIVE',
            joined_at: new Date(),
        });

        return savedGroup;
    }

    // UC5.4: Update group (admin only)
    async updateGroup(groupId: string, userId: string, updateData: Partial<Group>): Promise<Group> {
        const member = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId, role: 'ADMIN' });
        if (!member) throw new Error('Unauthorized');

        const updatedGroup = await this.groupModel.findByIdAndUpdate(groupId, updateData, { new: true });
        if (!updatedGroup) throw new Error('Group not found');
        return updatedGroup;
    }

    // UC5.5: Delete group (admin only)
    async deleteGroup(groupId: string, userId: string): Promise<void> {
        const member = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId, role: 'ADMIN' });
        if (!member) throw new Error('Unauthorized');

        await this.groupModel.findByIdAndDelete(groupId);
        await this.groupMemberModel.deleteMany({ group_id: groupId });
        await this.groupPostModel.deleteMany({ group_id: groupId });
    }

    // UC5.1: Join group
    async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
        const group = await this.groupModel.findById(groupId);
        if (!group || group.status !== 'active') throw new Error('Group not found or inactive');

        const existingMember = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId });
        if (existingMember) throw new Error('Already a member');

        const member = await this.groupMemberModel.create({
            group_id: groupId,
            user_id: userId,
            status: group.require_post_approval ? 'PENDING' : 'ACTIVE',
            joined_at: new Date(),
        });

        if (member.status === 'ACTIVE') {
            await this.groupModel.findByIdAndUpdate(groupId, { $inc: { members_count: 1 } });
        } else {
            await this.groupModel.findByIdAndUpdate(groupId, { $inc: { pending_members: 1 } });
        }

        return member;
    }

    // UC5.2: Leave group
    async leaveGroup(groupId: string, userId: string): Promise<void> {
        const member = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId });
        if (!member) throw new Error('Not a member');

        await this.groupMemberModel.findByIdAndDelete(member._id);
        await this.groupModel.findByIdAndUpdate(groupId, { $inc: { members_count: -1 } });
    }

    // UC5.8: Invite member
    async inviteMember(groupId: string, inviterId: string, inviteeId: string): Promise<GroupMember> {
        const inviter = await this.groupMemberModel.findOne({ group_id: groupId, user_id: inviterId });
        if (!inviter || inviter.role === 'MEMBER') throw new Error('Unauthorized');

        const existing = await this.groupMemberModel.findOne({ group_id: groupId, user_id: inviteeId });
        if (existing) throw new Error('Already invited or member');

        const member = await this.groupMemberModel.create({
            group_id: groupId,
            user_id: inviteeId,
            status: 'PENDING',
            invited_by: inviterId,
        });

        await this.groupModel.findByIdAndUpdate(groupId, { $inc: { pending_members: 1 } });
        return member;
    }

    // UC5.9: Approve member (mod/admin)
    async approveMember(groupId: string, approverId: string, memberId: string): Promise<GroupMember> {
        const approver = await this.groupMemberModel.findOne({ group_id: groupId, user_id: approverId });
        if (!approver || (approver.role !== 'MODERATOR' && approver.role !== 'ADMIN')) throw new Error('Unauthorized');

        const member = await this.groupMemberModel.findByIdAndUpdate(
            memberId,
            { status: 'ACTIVE', joined_at: new Date() },
            { new: true }
        );
        if (!member) throw new Error('Member not found');

        await this.groupModel.findByIdAndUpdate(groupId, {
            $inc: { members_count: 1, pending_members: -1 }
        });

        return member;
    }

    // UC5.10: Remove member (mod/admin)
    async removeMember(groupId: string, removerId: string, memberId: string): Promise<void> {
        const remover = await this.groupMemberModel.findOne({ group_id: groupId, user_id: removerId });
        if (!remover || (remover.role !== 'MODERATOR' && remover.role !== 'ADMIN')) throw new Error('Unauthorized');

        const member = await this.groupMemberModel.findById(memberId);
        if (!member) throw new Error('Member not found');

        await this.groupMemberModel.findByIdAndDelete(memberId);
        await this.groupModel.findByIdAndUpdate(groupId, { $inc: { members_count: -1 } });
    }

    // UC5.11: Get members list (mod/admin)
    async getMembers(groupId: string, userId: string): Promise<GroupMember[]> {
        const user = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId });
        if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) throw new Error('Unauthorized');

        return this.groupMemberModel.find({ group_id: groupId }).populate('user_id');
    }

    // UC5.12: Promote to moderator (admin only)
    async promoteToModerator(groupId: string, adminId: string, memberId: string): Promise<GroupMember> {
        const admin = await this.groupMemberModel.findOne({ group_id: groupId, user_id: adminId, role: 'ADMIN' });
        if (!admin) throw new Error('Unauthorized');

        const promotedMember = await this.groupMemberModel.findByIdAndUpdate(memberId, { role: 'MODERATOR' }, { new: true });
        if (!promotedMember) throw new Error('Member not found');
        return promotedMember;
    }

    // UC5.13: Transfer admin (admin only)
    async transferAdmin(groupId: string, currentAdminId: string, newAdminId: string): Promise<void> {
        const currentAdmin = await this.groupMemberModel.findOne({ group_id: groupId, user_id: currentAdminId, role: 'ADMIN' });
        if (!currentAdmin) throw new Error('Unauthorized');

        await this.groupMemberModel.findByIdAndUpdate(currentAdmin._id, { role: 'MODERATOR' });
        await this.groupMemberModel.findOneAndUpdate(
            { group_id: groupId, user_id: newAdminId },
            { role: 'ADMIN' }
        );
    }

    // Group posts
    async createGroupPost(groupId: string, userId: string, postData: Partial<GroupPost>): Promise<GroupPost> {
        const member = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId, status: 'ACTIVE' });
        if (!member) throw new Error('Not a member');

        const group = await this.groupModel.findById(groupId);
        if (!group) throw new Error('Group not found');
        const status = group.require_post_approval ? 'PENDING' : 'APPROVED';

        const post = await this.groupPostModel.create({
            ...postData,
            group_id: groupId,
            user_id: userId,
            status,
        });

        if (status === 'PENDING') {
            await this.groupModel.findByIdAndUpdate(groupId, { $inc: { pending_posts: 1 } });
        }

        return post;
    }

    // UC5.6: Approve post (mod/admin)
    async approvePost(groupId: string, approverId: string, postId: string): Promise<GroupPost> {
        const approver = await this.groupMemberModel.findOne({ group_id: groupId, user_id: approverId });
        if (!approver || (approver.role !== 'MODERATOR' && approver.role !== 'ADMIN')) throw new Error('Unauthorized');

        const post = await this.groupPostModel.findByIdAndUpdate(
            postId,
            { status: 'APPROVED', approved_by: approverId, approved_at: new Date() },
            { new: true }
        );
        if (!post) throw new Error('Post not found');

        await this.groupModel.findByIdAndUpdate(groupId, { $inc: { pending_posts: -1 } });
        return post;
    }

    async deletePost(groupId: string, deleterId: string, postId: string): Promise<void> {
        const deleter = await this.groupMemberModel.findOne({ group_id: groupId, user_id: deleterId });
        if (!deleter || (deleter.role !== 'MODERATOR' && deleter.role !== 'ADMIN')) throw new Error('Unauthorized');

        await this.groupPostModel.findByIdAndDelete(postId);
    }

    async getGroupPosts(groupId: string): Promise<GroupPost[]> {
        return this.groupPostModel.find({ group_id: groupId, status: 'APPROVED' }).populate('user_id');
    }

    // UC5.12: Get posts list (mod/admin)
    async getPosts(groupId: string, userId: string): Promise<GroupPost[]> {
        const user = await this.groupMemberModel.findOne({ group_id: groupId, user_id: userId });
        if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) throw new Error('Unauthorized');

        return this.groupPostModel.find({ group_id: groupId }).populate('user_id');
    }
}
