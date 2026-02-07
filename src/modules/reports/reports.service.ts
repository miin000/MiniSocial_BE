
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from './schemas/report.scheme';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<Report>,
    ) { }

    async create(createReportDto: CreateReportDto): Promise<Report> {
        const createdReport = new this.reportModel({
            ...createReportDto,
            status: 'pending',
        });
        return createdReport.save();
    }

    async findAll(): Promise<Report[]> {
        return this.reportModel.find().sort({ created_at: -1 }).exec();
    }

    async findByReporter(reporterId: string): Promise<Report[]> {
        return this.reportModel
            .find({ reporter_id: reporterId })
            .sort({ created_at: -1 })
            .exec();
    }

    async findByPostId(postId: string): Promise<Report[]> {
        return this.reportModel
            .find({ reported_post_id: postId })
            .exec();
    }
}
