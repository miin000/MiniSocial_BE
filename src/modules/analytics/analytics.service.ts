
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthlyStats } from './schemas/monthly-stats.schema';
import { DailyStats } from './schemas/daily-stats.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(DailyStats.name) private dailyStatsModel: Model<DailyStats>,
        @InjectModel(MonthlyStats.name) private monthlyStatsModel: Model<MonthlyStats>,
    ) { }
}
