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

    // Ghi notification vào Firestore để Flutter nhận real-time
    async writeNotification(data: {
        user_id: string;
        sender_id?: string;
        type: string;
        content: string;
        ref_id?: string;
        ref_type?: string;
        mongo_id?: string;
    }) {
        try {
            if (!this.firestore) return;

            await this.firestore
                .collection('notifications')
                .add({
                    user_id: data.user_id,
                    sender_id: data.sender_id || null,
                    type: data.type,
                    content: data.content,
                    ref_id: data.ref_id || null,
                    ref_type: data.ref_type || null,
                    mongo_id: data.mongo_id || null,
                    is_read: false,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                });
        } catch (error) {
            this.logger.warn('Failed to write notification to Firestore:', error.message);
        }
    }

    // Đánh dấu đọc trên Firestore
    async markNotificationRead(mongoId: string) {
        try {
            if (!this.firestore) return;

            const snapshot = await this.firestore
                .collection('notifications')
                .where('mongo_id', '==', mongoId)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({ is_read: true });
            }
        } catch (error) {
            this.logger.warn('Failed to mark notification read in Firestore:', error.message);
        }
    }

    // Đánh dấu tất cả đọc trên Firestore
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
        } catch (error) {
            this.logger.warn('Failed to mark all read in Firestore:', error.message);
        }
    }

    // Xóa notification trên Firestore
    async deleteNotification(mongoId: string) {
        try {
            if (!this.firestore) return;

            const snapshot = await this.firestore
                .collection('notifications')
                .where('mongo_id', '==', mongoId)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
            }
        } catch (error) {
            this.logger.warn('Failed to delete notification from Firestore:', error.message);
        }
    }
}
