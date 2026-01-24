
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationParticipantDocument = HydratedDocument<ConversationParticipant>;

@Schema()
export class ConversationParticipant {
    @Prop()
    conv_id: string;

    @Prop()
    user_id: string;

    @Prop()
    role: string;

    @Prop()
    joined_at: Date;

    @Prop()
    left_at: Date;

    @Prop()
    last_read_at: Date;
}

export const ConversationParticipantSchema = SchemaFactory.createForClass(ConversationParticipant);