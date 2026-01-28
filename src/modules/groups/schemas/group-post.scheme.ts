import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupPostDocument = HydratedDocument<GroupPost>;

export enum GroupPostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class GroupPost {
    @Prop({ required: true })
    group_id: string;

    @Prop({ required: true })
    user_id: string;

    @Prop()
    content: string;

    @Prop()
    media_url: string;

    @Prop()
    content_type: string;

    @Prop({ type: String, enum: GroupPostStatus, default: GroupPostStatus.PENDING })
    status: GroupPostStatus;

    @Prop()
    approved_by: string;

    @Prop()
    approved_at: Date;

    @Prop()
    rejected_reason: string;

    @Prop()
    likes_count: number;

    @Prop()
    comments_count: number;

    created_at: Date;
    updated_at: Date;
}

export const GroupPostSchema = SchemaFactory.createForClass(GroupPost);