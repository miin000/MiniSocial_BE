
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from './schemas/report.scheme';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Document.name) private documentModel: Model<Document>,
        @InjectModel(Report.name) private reportModel: Model<Report>,
    ) { }
}
