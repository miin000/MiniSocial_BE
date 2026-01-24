
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Like {
    @Prop()
    user_id: string;

    @Prop()
    post_id: string;

    @Prop()
    comment_id: string;

    created_at: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);