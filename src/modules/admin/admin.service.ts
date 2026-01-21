
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivityLog } from './schemas/user-activity-log.schema';
import { SystemLogs } from './schemas/system-logs.schema';
import { SystemSettings } from './schemas/system-settings.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(SystemLogs.name) private systemLogsModel: Model<SystemLogs>,
        @InjectModel(SystemSettings.name) private systemSettingsModel: Model<SystemSettings>,
        @InjectModel(UserActivityLog.name) private userActivityLogModel: Model<UserActivityLog>,
    ) { }
}
