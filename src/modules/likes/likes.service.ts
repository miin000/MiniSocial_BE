
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from './schemas/like.scheme';

@Injectable()
export class LikesService {
    constructor(
        @InjectModel(Like.name) private likeModel: Model<Like>,
    ) { }
}
