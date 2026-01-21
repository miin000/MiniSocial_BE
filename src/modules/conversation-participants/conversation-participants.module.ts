
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationParticipantSchema } from './schemas/conversation-participants.scheme';
import { ConversationParticipantsController } from './conversation-participants.controller';
import { ConversationParticipantsService } from './conversation-participants.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ConversationParticipant', schema: ConversationParticipantSchema },
    ])
  ],

  controllers: [ConversationParticipantsController],
  providers: [ConversationParticipantsService],
  exports: [ConversationParticipantsService],
})
export class ConversationParticipantsModule {}
