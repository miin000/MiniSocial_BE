
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.scheme';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async createUser(name: string, age: number, breed: string): Promise<User> {
        const newUser = new this.userModel({ name, age, breed });
        return newUser.save();
    }
}
