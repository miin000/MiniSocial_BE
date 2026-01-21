import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DailyStats, DailyStatsSchema } from './schemas/daily-stats.schema';
import { MonthlyStats, MonthlyStatsSchema } from './schemas/monthly-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyStats.name, schema: DailyStatsSchema },
      { name: MonthlyStats.name, schema: MonthlyStatsSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
