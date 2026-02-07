
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Post {
    @Prop()
    user_id: string;

    @Prop()
    content: string;

    @Prop([String])
    media_urls: string[];

    @Prop()
    content_type: string;

    @Prop({ default: 'active' })
    status: string;

    @Prop()
    approved_by: string;

    @Prop()
    approved_at: Date;

    @Prop({ default: 0 })
    likes_count: number;

    @Prop({ default: 0 })
    comments_count: number;

    @Prop({ default: 0 })
    shares_count: number;

    created_at: Date;
    updated_at: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);