
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Message {
    @Prop()
    conv_id: string;

    @Prop()
    sender_id: string;

    @Prop()
    content: string;

    @Prop()
    media_url: string;

    @Prop()
    message_type: string;

    @Prop()
    reply_to_id: string;

    @Prop()
    is_edited: boolean;

    @Prop()
    is_deleted: boolean;

    created_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);