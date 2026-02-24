
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group, GroupSchema } from './schemas/group.scheme';
import { GroupMember, GroupMemberSchema } from './schemas/group-member.scheme';
import { GroupPost, GroupPostSchema } from './schemas/group-post.scheme';
import { GroupRolesGuard } from './guards/group-roles.guard';
import { User, UserSchema } from '../users/schemas/user.scheme';
import { Like, LikeSchema } from '../likes/schemas/like.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: GroupPost.name, schema: GroupPostSchema },
      { name: User.name, schema: UserSchema },
      { name: Like.name, schema: LikeSchema },
    ])
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupRolesGuard],
  exports: [GroupsService],
})
export class GroupsModule {}

