
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema()
export class Like {
    @Prop()
    user_id: string;

    @Prop()
    post_id: string;

    @Prop()
    comment_id: string;

    @Prop()
    created_at: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);