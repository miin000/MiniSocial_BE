
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema()
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

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);