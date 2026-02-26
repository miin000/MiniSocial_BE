// src/common/services/firebase.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private firestore: admin.firestore.Firestore;

    onModuleInit() {
        try {
            // Kiểm tra nếu đã khởi tạo
            if (admin.apps.length === 0) {
                const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
                if (serviceAccount) {
                    // Khởi tạo từ JSON service account trong env
                    const parsed = JSON.parse(serviceAccount);
                    admin.initializeApp({
                        credential: admin.credential.cert(parsed),
                    });
                } else {
                    // Fallback: dùng Application Default Credentials
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault(),
                    });
                }
            }
            this.firestore = admin.firestore();
            this.logger.log('Firebase Admin initialized successfully');
        } catch (error) {
            this.logger.error('Firebase Admin initialization failed:', error.message);
        }
    }

    getFirestore(): admin.firestore.Firestore | null {
        return this.firestore || null;
    }

    // ==================== NOTIFICATION CRUD (Firestore only) ====================

    // Tạo notification mới vào Firestore
    async writeNotification(data: {
        user_id: string;
        sender_id?: string;
        type: string;
        content: string;
        ref_id?: string;
        ref_type?: string;
    }): Promise<string | null> {
        try {
            if (!this.firestore) return null;

            const docRef = await this.firestore
                .collection('notifications')
                .add({
                    user_id: data.user_id,
                    sender_id: data.sender_id || null,
                    type: data.type,
                    content: data.content,
                    ref_id: data.ref_id || null,
                    ref_type: data.ref_type || null,
                    is_read: false,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                });
            return docRef.id;
        } catch (error) {
            this.logger.warn('Failed to write notification to Firestore:', error.message);
            return null;
        }
    }

    // Lấy notifications theo user_id (phân trang)
    async getNotifications(userId: string, page: number = 1, limit: number = 20) {
        try {
            if (!this.firestore) return { data: [], total: 0, page, limit, totalPages: 0 };

            // Lấy tổng số
            const countSnapshot = await this.firestore
                .collection('notifications')
                .where('user_id', '==', userId)
                .count()
                .get();
            const total = countSnapshot.data().count;

            // Lấy data phân trang
            let query = this.firestore
                .collection('notifications')
                .where('user_id', '==', userId)
                .orderBy('created_at', 'desc')
                .limit(limit);

            // Skip bằng cách lấy doc cuối của page trước
            if (page > 1) {
                const skipDocs = await this.firestore
                    .collection('notifications')
                    .where('user_id', '==', userId)
                    .orderBy('created_at', 'desc')
                    .limit((page - 1) * limit)
                    .get();
                if (!skipDocs.empty) {
                    const lastDoc = skipDocs.docs[skipDocs.docs.length - 1];
                    query = query.startAfter(lastDoc);
                }
            }

            const snapshot = await query.get();
            const data = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate?.() || new Date(),
            }));

            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            this.logger.warn('Failed to get notifications from Firestore:', error.message);
            return { data: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    // Đếm notification chưa đọc
    async getUnreadCount(userId: string): Promise<number> {
        try {
            if (!this.firestore) return 0;

            const snapshot = await this.firestore
                .collection('notifications')
                .where('user_id', '==', userId)
                .where('is_read', '==', false)
                .count()
                .get();
            return snapshot.data().count;
        } catch (error) {
            this.logger.warn('Failed to get unread count from Firestore:', error.message);
            return 0;
        }
    }

    // Đánh dấu 1 notification đã đọc (theo Firestore doc ID)
    async markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
        try {
            if (!this.firestore) return false;

            const docRef = this.firestore.collection('notifications').doc(notificationId);
            const doc = await docRef.get();
            if (doc.exists && doc.data()?.user_id === userId) {
                await docRef.update({ is_read: true });
                return true;
            }
            return false;
        } catch (error) {
            this.logger.warn('Failed to mark notification read in Firestore:', error.message);
            return false;
        }
    }

    // Đánh dấu tất cả đọc
    async markAllNotificationsRead(userId: string) {
        try {
            if (!this.firestore) return;

            const snapshot = await this.firestore
                .collection('notifications')
                .where('user_id', '==', userId)
                .where('is_read', '==', false)
                .get();

            const batch = this.firestore.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { is_read: true });
            });
            await batch.commit();
            return { modifiedCount: snapshot.size };
        } catch (error) {
            this.logger.warn('Failed to mark all read in Firestore:', error.message);
            return { modifiedCount: 0 };
        }
    }

    // Xóa notification (theo Firestore doc ID)
    async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
        try {
            if (!this.firestore) return false;

            const docRef = this.firestore.collection('notifications').doc(notificationId);
            const doc = await docRef.get();
            if (doc.exists && doc.data()?.user_id === userId) {
                await docRef.delete();
                return true;
            }
            return false;
        } catch (error) {
            this.logger.warn('Failed to delete notification from Firestore:', error.message);
            return false;
        }
    }

    // Tạo Firebase Custom Token để Flutter sign in Firebase Auth
    // Dùng MongoDB user ID làm Firebase UID → Firestore rules match user_id
    async createCustomToken(userId: string): Promise<string | null> {
        try {
            const token = await admin.auth().createCustomToken(userId);
            return token;
        } catch (error) {
            this.logger.warn('Failed to create Firebase custom token:', error.message);
            return null;
        }
    }
}
