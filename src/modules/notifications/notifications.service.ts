
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.scheme';
import { FirebaseService } from '../../common/services/firebase.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        private readonly firebaseService: FirebaseService,
    ) { }

    // Create a new notification (MongoDB + Firestore)
    async create(data: {
        user_id: string;
        sender_id?: string;
        type: string;
        content: string;
        ref_id?: string;
        ref_type?: string;
    }) {
        const notification = new this.notificationModel({
            ...data,
            is_read: false,
        });
        const saved = await notification.save();

        // Sync to Firestore for real-time
        await this.firebaseService.writeNotification({
            ...data,
            mongo_id: saved._id.toString(),
        });

        return saved;
    }

    // Get all notifications for a user (paginated)
    async findAllByUser(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        console.log('[NotificationsService] findAllByUser userId:', userId, 'type:', typeof userId);
        // Debug: count all docs first
        const totalAll = await this.notificationModel.countDocuments({});
        console.log('[NotificationsService] Total docs in collection:', totalAll);
        const [notifications, total] = await Promise.all([
            this.notificationModel
                .find({ user_id: userId })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.notificationModel.countDocuments({ user_id: userId }),
        ]);
        console.log('[NotificationsService] Found', total, 'notifications for user', userId);

        return {
            data: notifications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Get unread count for a user
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            user_id: userId,
            is_read: false,
        });
    }

    // Mark a single notification as read
    async markAsRead(notificationId: string, userId: string) {
        const result = await this.notificationModel.findOneAndUpdate(
            { _id: notificationId, user_id: userId },
            { is_read: true },
            { new: true },
        );

        // Sync to Firestore
        await this.firebaseService.markNotificationRead(notificationId);

        return result;
    }

    // Mark all notifications as read for a user
    async markAllAsRead(userId: string) {
        const result = await this.notificationModel.updateMany(
            { user_id: userId, is_read: false },
            { is_read: true },
        );

        // Sync to Firestore
        await this.firebaseService.markAllNotificationsRead(userId);

        return { modifiedCount: result.modifiedCount };
    }

    // Delete a notification
    async delete(notificationId: string, userId: string) {
        const result = await this.notificationModel.findOneAndDelete({
            _id: notificationId,
            user_id: userId,
        });

        // Sync to Firestore
        await this.firebaseService.deleteNotification(notificationId);

        return result;
    }
}
