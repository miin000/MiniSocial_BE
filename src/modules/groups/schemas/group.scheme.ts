
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Like } from 'src/modules/likes/schemas/like.scheme';

export type GroupDocument = HydratedDocument<Group>;

@Schema()
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

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);