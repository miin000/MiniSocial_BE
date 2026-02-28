
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/messages.scheme';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ConversationParticipant, ConversationParticipantSchema } from '../conversation-participants/schemas/conversation-participants.scheme';
import { UserSchema } from '../users/schemas/user.scheme';
import { ConversationsModule } from '../conversations/conversations.module';
import { UserInteractionsModule } from '../user-interactions/user-interactions.module';
import { FirebaseService } from '../../common/services/firebase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: ConversationParticipant.name, schema: ConversationParticipantSchema },
      { name: 'User', schema: UserSchema },
    ]),
    forwardRef(() => ConversationsModule),
    UserInteractionsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, FirebaseService],
  exports: [MessagesService],
})
export class MessagesModule {}
