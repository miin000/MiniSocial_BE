
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageType } from './schemas/messages.scheme';
import { ConversationParticipant } from '../conversation-participants/schemas/conversation-participants.scheme';
import { SendMessageDto, SharePostDto, EditMessageDto } from './dto/message.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { UserInteractionsService } from '../user-interactions/user-interactions.service';
import { InteractionType } from '../user-interactions/schemas/user-interaction.schema';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(ConversationParticipant.name) private participantModel: Model<ConversationParticipant>,
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel('Post') private postModel: Model<any>,
        private readonly conversationsService: ConversationsService,
        private readonly firebaseService: FirebaseService,
        private readonly userInteractionsService: UserInteractionsService,
    ) { }

    // ── Gửi tin nhắn (text, ảnh, file) ─────────────────────────────────────
    async send(dto: SendMessageDto): Promise<any> {
        // Kiểm tra user có trong conversation không
        await this.requireParticipant(dto.conv_id, dto.sender_id);

        const message = new this.messageModel({
            conv_id: dto.conv_id,
            sender_id: dto.sender_id,
            content: dto.content || '',
            media_urls: dto.media_urls || [],
            file_url: dto.file_url,
            file_name: dto.file_name,
            file_size: dto.file_size || 0,
            message_type: dto.message_type || MessageType.TEXT,
            reply_to_id: dto.reply_to_id || null,
        });
        const saved = await message.save();

        // Cập nhật last message cho conversation
        const displayContent = this.getDisplayContent(saved);
        await this.conversationsService.updateLastMessage(
            dto.conv_id, saved._id.toString(), displayContent, dto.sender_id,
        );

        // Gửi notification cho các thành viên khác
        await this.notifyParticipants(dto.conv_id, dto.sender_id, displayContent);

        return this.enrichMessage(saved);
    }

    // ── Chia sẻ bài viết vào chat ──────────────────────────────────────────
    async sharePost(dto: SharePostDto): Promise<any> {
        await this.requireParticipant(dto.conv_id, dto.sender_id);

        const message = new this.messageModel({
            conv_id: dto.conv_id,
            sender_id: dto.sender_id,
            content: dto.content || '',
            message_type: MessageType.SHARE_POST,
            shared_post_id: dto.post_id,
        });
        const saved = await message.save();

        const displayContent = 'đã chia sẻ một bài viết';
        await this.conversationsService.updateLastMessage(
            dto.conv_id, saved._id.toString(), displayContent, dto.sender_id,
        );

        // Ghi interaction share cho hệ thống khuyến nghị
        await this.userInteractionsService.record({
            user_id: dto.sender_id,
            post_id: dto.post_id,
            interaction_type: InteractionType.SHARE,
        });

        await this.notifyParticipants(dto.conv_id, dto.sender_id, displayContent);

        return this.enrichMessage(saved);
    }

    // ── Lấy tin nhắn của conversation (phân trang) ─────────────────────────
    async findByConversation(
        convId: string, userId: string, page: number = 1, limit: number = 30,
    ): Promise<{ messages: any[]; total: number }> {
        await this.requireParticipant(convId, userId);
        const skip = (page - 1) * limit;

        const query: any = {
            conv_id: convId,
            is_deleted: { $ne: true },
        };

        const [messages, total] = await Promise.all([
            this.messageModel
                .find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.messageModel.countDocuments(query),
        ]);

        const enriched = await Promise.all(messages.map(m => this.enrichMessage(m)));

        // Đánh dấu đã đọc
        await this.conversationsService.markAsRead(convId, userId);

        return { messages: enriched.reverse(), total };
    }

    // ── Sửa tin nhắn ───────────────────────────────────────────────────────
    async edit(messageId: string, userId: string, dto: EditMessageDto): Promise<any> {
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg) throw new NotFoundException('Tin nhắn không tồn tại');
        if (msg.sender_id !== userId) throw new ForbiddenException('Bạn chỉ có thể sửa tin nhắn của mình');
        if (msg.is_recalled) throw new BadRequestException('Tin nhắn đã bị thu hồi');
        if (msg.message_type !== MessageType.TEXT) throw new BadRequestException('Chỉ có thể sửa tin nhắn văn bản');

        msg.content = dto.content;
        msg.is_edited = true;
        msg.edited_at = new Date();
        const saved = await msg.save();

        return this.enrichMessage(saved);
    }

    // ── Thu hồi tin nhắn ────────────────────────────────────────────────────
    async recall(messageId: string, userId: string): Promise<any> {
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg) throw new NotFoundException('Tin nhắn không tồn tại');
        if (msg.sender_id !== userId) throw new ForbiddenException('Bạn chỉ có thể thu hồi tin nhắn của mình');

        msg.is_recalled = true;
        msg.recalled_at = new Date();
        msg.content = '';
        msg.media_urls = [];
        msg.file_url = '' as any;
        msg.file_name = '' as any;
        const saved = await msg.save();

        return this.enrichMessage(saved);
    }

    // ── Xóa tin nhắn (soft delete, chỉ ẩn phía mình) ───────────────────────
    async softDelete(messageId: string, userId: string): Promise<void> {
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg) throw new NotFoundException('Tin nhắn không tồn tại');
        if (msg.sender_id !== userId) throw new ForbiddenException('Bạn chỉ có thể xóa tin nhắn của mình');

        msg.is_deleted = true;
        await msg.save();
    }

    // ── Xóa toàn bộ lịch sử chat (chỉ xóa phía người dùng) ────────────────
    async deleteHistory(convId: string, userId: string): Promise<void> {
        await this.requireParticipant(convId, userId);
        // Trong thực tế cần bảng riêng cho deleted_for_users
        // Ở đây đơn giản: đánh dấu last_read_at = now (ẩn tin nhắn cũ)
        await this.conversationsService.markAsRead(convId, userId);
    }

    // ── Helper: lấy tin nhắn gốc khi reply ──────────────────────────────────
    private async enrichMessage(msg: any): Promise<any> {
        const obj = msg.toObject ? msg.toObject() : msg;

        // Thông tin người gửi
        const sender = await this.userModel
            .findById(obj.sender_id)
            .select('_id full_name username avatar_url')
            .lean()
            .exec();

        // Nếu là reply, lấy tin nhắn gốc
        let replyTo: any = null;
        if (obj.reply_to_id) {
            const original = await this.messageModel.findById(obj.reply_to_id).lean().exec();
            if (original) {
                const origSender = await this.userModel
                    .findById(original.sender_id)
                    .select('_id full_name username avatar_url')
                    .lean()
                    .exec();
                replyTo = {
                    _id: original._id,
                    content: (original as any).is_recalled ? 'Tin nhắn đã bị thu hồi' : original.content,
                    sender_info: origSender,
                };
            }
        }

        // Nếu là share_post, lấy thông tin bài viết
        let sharedPostInfo: any = null;
        if (obj.shared_post_id && obj.message_type === MessageType.SHARE_POST) {
            const post = await this.postModel.findById(obj.shared_post_id).lean().exec();
            if (post) {
                const postAuthor = await this.userModel
                    .findById((post as any).user_id)
                    .select('_id full_name username avatar_url')
                    .lean()
                    .exec();
                sharedPostInfo = {
                    _id: (post as any)._id,
                    content: (post as any).content,
                    media_urls: (post as any).media_urls || [],
                    user_name: (postAuthor as any)?.full_name || (postAuthor as any)?.username || 'Ẩn danh',
                    user_avatar: (postAuthor as any)?.avatar_url || null,
                    likes_count: (post as any).likes_count || 0,
                    comments_count: (post as any).comments_count || 0,
                    tags: (post as any).tags || [],
                    created_at: (post as any).created_at,
                };
            }
        }

        // Nếu đã thu hồi, giấu nội dung
        if (obj.is_recalled) {
            return {
                ...obj,
                content: 'Tin nhắn đã bị thu hồi',
                media_urls: [],
                file_url: null,
                file_name: null,
                sender_info: sender,
                reply_to: replyTo,
                shared_post_info: null,
            };
        }

        return {
            ...obj,
            sender_info: sender,
            reply_to: replyTo,
            shared_post_info: sharedPostInfo,
        };
    }

    // ── Helper: kiểm tra tham gia ───────────────────────────────────────────
    private async requireParticipant(convId: string, userId: string): Promise<void> {
        const p = await this.participantModel.findOne({
            conv_id: convId, user_id: userId, left_at: null,
        }).exec();
        if (!p) throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    // ── Helper: nội dung hiển thị cho last_message ──────────────────────────
    private getDisplayContent(msg: any): string {
        if (msg.message_type === MessageType.IMAGE) return '📷 Hình ảnh';
        if (msg.message_type === MessageType.FILE) return `📎 ${msg.file_name || 'Tệp'}`;
        if (msg.message_type === MessageType.SHARE_POST) return '📝 Đã chia sẻ bài viết';
        return msg.content?.substring(0, 100) || '';
    }

    // ── Helper: gửi notification ────────────────────────────────────────────
    private async notifyParticipants(convId: string, senderId: string, content: string): Promise<void> {
        try {
            const participants = await this.participantModel
                .find({ conv_id: convId, left_at: null, is_muted: { $ne: true } })
                .lean()
                .exec();

            const sender = await this.userModel
                .findById(senderId)
                .select('full_name username')
                .lean()
                .exec();
            const senderName = (sender as any)?.full_name || (sender as any)?.username || 'Ai đó';

            for (const p of participants) {
                if (p.user_id === senderId) continue;
                await this.firebaseService.writeNotification({
                    user_id: p.user_id,
                    sender_id: senderId,
                    type: 'message',
                    content: `${senderName}: ${content}`,
                    ref_id: convId,
                    ref_type: 'conversation',
                });
            }
        } catch {
            // không để lỗi notification fail request chính
        }
    }
}
