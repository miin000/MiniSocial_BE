
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Group {
    @Prop()
    creator_id: string;

    @Prop()
    name: string;

    @Prop()
    description: string;

    @Prop()
    avatar_url: string;

    @Prop()
    cover_url: string;

    @Prop()
    members_count: number;

    @Prop()
    pending_posts: number;

    @Prop()
    pending_members: number;

    @Prop()
    require_post_approval: boolean;

    created_at: Date;
    updated_at: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);