
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivityLog } from './schemas/user-activity-log.schema';
import { SystemLogs } from './schemas/system-logs.schema';
import { SystemSettings } from './schemas/system-settings.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(SystemLogs.name) private systemLogsModel: Model<SystemLogs>,
        @InjectModel(SystemSettings.name) private systemSettingsModel: Model<SystemSettings>,
        @InjectModel(UserActivityLog.name) private userActivityLogModel: Model<UserActivityLog>,
        private usersService: UsersService,
    ) { }

    // User management methods
    async getAllUsers() {
        return this.usersService.findAll();
    }

    async deleteUser(id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }

    // Block/Unblock user methods
    async blockUser(id: string) {
        return this.usersService.blockUser(id);
    }

    async unblockUser(id: string) {
        return this.usersService.unblockUser(id);
    }
}
