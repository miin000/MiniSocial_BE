
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Friend, FriendDocument } from './schemas/friend.scheme';
import { UsersService } from '../users/users.service';

@Injectable()
export class FriendsService {
    private readonly logger = new Logger(FriendsService.name);

    constructor(
        @InjectModel(Friend.name) private friendModel: Model<FriendDocument>,
        private readonly usersService: UsersService,
    ) {}

    // List accepted friends for a user
    async getFriends(userId: string) {
        const docs = await this.friendModel
            .find({
                status: 'accepted',
                $or: [{ user_id_1: userId }, { user_id_2: userId }],
            })
            .exec();

        const results = await Promise.all(
            docs.map(async (d) => {
                const otherId = d.user_id_1.toString() === userId ? d.user_id_2 : d.user_id_1;
                try {
                    const user = await this.usersService.findById(otherId);
                    return {
                        id: user._id,
                        fullName: (user as any).full_name || (user as any).fullName || (user as any).username,
                        avatar: (user as any).avatar || (user as any).avatar_url,
                    };
                } catch (e) {
                    this.logger.warn(`Could not load user ${otherId}: ${e}`);
                    return { id: otherId };
                }
            }),
        );

        return results;
    }

    // Get incoming friend requests for a user
    async getRequests(userId: string) {
        const docs = await this.friendModel.find({ status: 'pending', user_id_2: userId }).exec();

        const results = await Promise.all(
            docs.map(async (d) => {
                try {
                    const from = await this.usersService.findById(d.user_id_1);
                    return {
                        requestId: d._id,
                        fromId: d.user_id_1,
                        fromName: (from as any).full_name || (from as any).username,
                        avatar: (from as any).avatar || (from as any).avatar_url,
                    };
                } catch (e) {
                    return { requestId: d._id, fromId: d.user_id_1 };
                }
            }),
        );

        return results;
    }

    // Return simple suggestions (users that are not friends and not the same user)
    async getSuggestions(userId: string, limit = 10) {
        // fetch all users and filter out existing friends & self — simple implementation
        const allUsers = await this.usersService.findAll();

        const friends = await this.friendModel
            .find({ status: 'accepted', $or: [{ user_id_1: userId }, { user_id_2: userId }] })
            .exec();

        const friendIds = new Set<string>();
        friends.forEach((f) => {
            friendIds.add(f.user_id_1);
            friendIds.add(f.user_id_2);
        });

        const suggestions = (allUsers as any[])
            .filter((u) => u._id.toString() !== userId && !friendIds.has(u._id.toString()))
            .slice(0, limit)
            .map((u) => ({ id: u._id, fullName: u.full_name || u.username, avatar: u.avatar || u.avatar_url }));

        return suggestions;
    }

    // Send friend request
    async sendRequest(fromUserId: string, toUserId: string) {
        if (fromUserId === toUserId) throw new BadRequestException('Cannot send request to yourself');

        // Check existing relationship
        const exists = await this.friendModel
            .findOne({
                $or: [
                    { user_id_1: fromUserId, user_id_2: toUserId },
                    { user_id_1: toUserId, user_id_2: fromUserId },
                ],
            })
            .exec();

        if (exists) {
            if (exists.status === 'pending') throw new BadRequestException('Request already pending');
            if (exists.status === 'accepted') throw new BadRequestException('Already friends');
        }

        const created = new this.friendModel({ user_id_1: fromUserId, user_id_2: toUserId, status: 'pending', action_user_id: fromUserId });
        await created.save();
        return { message: 'Request sent', id: created._id };
    }

    // Accept friend request
    async acceptRequest(userId: string, requestId: string) {
        const doc = await this.friendModel.findById(requestId).exec();
        if (!doc) throw new NotFoundException('Request not found');
        if (doc.user_id_2.toString() !== userId) throw new BadRequestException('Not authorized to accept');

        doc.status = 'accepted';
        doc.action_user_id = userId;
        await doc.save();
        return { message: 'Accepted' };
    }

    // Reject friend request
    async rejectRequest(userId: string, requestId: string) {
        const doc = await this.friendModel.findById(requestId).exec();
        if (!doc) throw new NotFoundException('Request not found');
        if (doc.user_id_2.toString() !== userId) throw new BadRequestException('Not authorized to reject');

        doc.status = 'rejected';
        doc.action_user_id = userId;
        await doc.save();
        return { message: 'Rejected' };
    }

    // Remove friend (unfriend)
    async removeFriend(userId: string, friendId: string) {
        const doc = await this.friendModel
            .findOneAndDelete({
                status: 'accepted',
                $or: [
                    { user_id_1: userId, user_id_2: friendId },
                    { user_id_1: friendId, user_id_2: userId },
                ],
            })
            .exec();

        if (!doc) throw new NotFoundException('Friend relationship not found');
        return { message: 'Removed' };
    }
}
