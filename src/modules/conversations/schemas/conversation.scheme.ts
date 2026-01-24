
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Conversation {
    @Prop()
    type: string;

    @Prop()
    name: string;

    @Prop()
    avatar_url: string;

    @Prop()
    creator_id: string;

    @Prop()
    last_message_id: string;

    created_at: Date;
    updated_at: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);