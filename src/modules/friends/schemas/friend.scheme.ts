
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FriendDocument = HydratedDocument<Friend>;

@Schema()
export class Friend {
    @Prop()
    user_id_1: string;

    @Prop()
    user_id_2: string;

    @Prop()
    status: string;

    @Prop()
    action_user_id: string;

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);