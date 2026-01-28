
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupSchema } from './schemas/group.scheme';
import { GroupMemberSchema } from './schemas/group-member.scheme';
import { GroupPostSchema } from './schemas/group-post.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Group', schema: GroupSchema },
      { name: 'GroupMember', schema: GroupMemberSchema },
      { name: 'GroupPost', schema: GroupPostSchema },
    ])
  ],

  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
