
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationParticipant } from './schemas/conversation-participants.scheme';

@Injectable()
export class ConversationParticipantsService {
    constructor(
        @InjectModel(ConversationParticipant.name) private conversationParticipantModel: Model<ConversationParticipant>,
    ) { }
}
