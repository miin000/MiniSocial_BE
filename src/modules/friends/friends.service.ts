
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friend } from './schemas/friend.scheme';

@Injectable()
export class FriendsService {
    constructor(
        @InjectModel(Friend.name) private friendModel: Model<Friend>,
    ) { }
}
