
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema()
export class Report {
    @Prop()
    reporter_id: string;

    @Prop()
    reported_id: string;

    @Prop()
    reported_post_id: string;

    // @Prop()
    // reported_message_id: string;

    @Prop()
    type: string;

    @Prop()
    reason: string;

    @Prop()
    description: string;

    @Prop()
    evidence_urls: string[];

    @Prop()
    status: string;

    @Prop()
    resolved_at: Date;

    @Prop()
    resolved_by: string;

    @Prop()
    resolved_note: string;

    @Prop()
    created_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);