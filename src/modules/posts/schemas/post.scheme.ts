
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Post {
    @Prop()
    user_id: string;

    @Prop()
    content: string;

    @Prop()
    media_url: string;

    @Prop()
    content_type: string;

    @Prop()
    status: string;

    @Prop()
    approved_by: string;

    @Prop()
    approved_at: Date;

    @Prop()
    likes_count: number;

    @Prop()
    comments_count: number;

    @Prop()
    shares_count: number;

    created_at: Date;
    updated_at: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);