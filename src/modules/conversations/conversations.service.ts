
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './schemas/conversation.scheme';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    ) { }
}
