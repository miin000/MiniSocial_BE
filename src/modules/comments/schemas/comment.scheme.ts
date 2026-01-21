
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
    @Prop()
    user_id: string;

    @Prop()
    post_id: string;

    @Prop()
    parent_id: string;

    @Prop()
    content: string;

    @Prop()
    likes_count: number;

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);