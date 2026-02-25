
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportStatus } from './schemas/report.scheme';
import { CreateReportDto, ResolveReportDto } from './dto/create-report.dto';
import { Post, PostStatus } from '../posts/schemas/post.scheme';
import { User } from '../users/schemas/user.scheme';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<Report>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async create(createReportDto: CreateReportDto): Promise<Report> {
        const createdReport = new this.reportModel({
            ...createReportDto,
            status: ReportStatus.PENDING,
        });
        return createdReport.save();
    }

    async findAll(page = 1, limit = 20, status?: string): Promise<{ reports: any[]; total: number }> {
        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const total = await this.reportModel.countDocuments(query);
        const reports = await this.reportModel
            .find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const enriched = await this.enrichReports(reports);
        return { reports: enriched, total };
    }

    async findById(id: string): Promise<any> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) throw new NotFoundException('Report not found');
        const enriched = await this.enrichReports([report]);
        return enriched[0];
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

    async resolve(id: string, resolvedBy: string, dto: ResolveReportDto): Promise<any> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) throw new NotFoundException('Report not found');

        report.status = ReportStatus.RESOLVED;
        report.resolved_at = new Date();
        report.resolved_by = resolvedBy;
        report.resolved_note = dto.resolved_note;
        report.action_taken = dto.action_taken || 'none';

        // Apply action
        if (dto.action_taken === 'remove_post' && report.reported_post_id) {
            await this.postModel.findByIdAndUpdate(report.reported_post_id, {
                status: PostStatus.DELETED,
            });
        } else if (dto.action_taken === 'ban_user' && report.reported_id) {
            await this.userModel.findByIdAndUpdate(report.reported_id, {
                status: 'BLOCKED',
            });
        }

        await report.save();
        const enriched = await this.enrichReports([report]);
        return enriched[0];
    }

    async reject(id: string, resolvedBy: string, dto: ResolveReportDto): Promise<any> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) throw new NotFoundException('Report not found');

        report.status = ReportStatus.REJECTED;
        report.resolved_at = new Date();
        report.resolved_by = resolvedBy;
        report.resolved_note = dto.resolved_note;
        report.action_taken = 'none';

        await report.save();
        const enriched = await this.enrichReports([report]);
        return enriched[0];
    }

    async getStats(): Promise<any> {
        const total = await this.reportModel.countDocuments();
        const pending = await this.reportModel.countDocuments({ status: ReportStatus.PENDING });
        const resolved = await this.reportModel.countDocuments({ status: ReportStatus.RESOLVED });
        const rejected = await this.reportModel.countDocuments({ status: ReportStatus.REJECTED });

        return { total, pending, resolved, rejected };
    }

    private async enrichReports(reports: Report[]): Promise<any[]> {
        const userIds = new Set<string>();
        const postIds = new Set<string>();

        for (const r of reports) {
            if (r.reporter_id) userIds.add(r.reporter_id);
            if (r.reported_id) userIds.add(r.reported_id);
            if (r.resolved_by) userIds.add(r.resolved_by);
            if (r.reported_post_id) postIds.add(r.reported_post_id);
        }

        const users = await this.userModel
            .find({ _id: { $in: Array.from(userIds) } })
            .select('username full_name avatar_url email')
            .exec();

        const posts = await this.postModel
            .find({ _id: { $in: Array.from(postIds) } })
            .exec();

        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        const postMap = new Map(posts.map(p => [p._id.toString(), p]));

        return reports.map(r => {
            const obj = (r as any).toObject ? (r as any).toObject() : r;
            const reporter = userMap.get(r.reporter_id);
            const reported = userMap.get(r.reported_id);
            const post = postMap.get(r.reported_post_id);
            const resolver = userMap.get(r.resolved_by);

            return {
                ...obj,
                reporter_info: reporter ? {
                    _id: reporter._id,
                    username: reporter.username,
                    full_name: reporter.full_name,
                    avatar_url: reporter.avatar_url,
                } : null,
                reported_user_info: reported ? {
                    _id: reported._id,
                    username: reported.username,
                    full_name: reported.full_name,
                    avatar_url: reported.avatar_url,
                } : null,
                post_info: post ? {
                    _id: post._id,
                    content: post.content,
                    media_urls: post.media_urls,
                    user_id: post.user_id,
                    status: post.status,
                    created_at: post.created_at,
                } : null,
                resolver_info: resolver ? {
                    _id: resolver._id,
                    username: resolver.username,
                    full_name: resolver.full_name,
                } : null,
            };
        });
    }
}
