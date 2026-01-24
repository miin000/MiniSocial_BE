
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Notification {
    @Prop()
    user_id: string;

    @Prop()
    sender_id: string;

    @Prop()
    type: string;

    @Prop()
    content: string;

    @Prop()
    ref_id: number;

    @Prop()
    ref_type: string;
    
    @Prop()
    is_read: boolean;

    created_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);