
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.scheme';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
        const created_user = new this.userModel(createUserDto);
        return created_user.save();
    }

    async findById(id: String): Promise<UserDocument> {
        const user = await this.userModel.findById(id).exec();
        
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async findOneByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).select('+password').exec();
    }
    
    async findOneByUsername(username: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ username }).select('+password').exec();
    }

    // async getProfile(userId: string): Promise<User> {
    //     const user = await this.userModel.findById(userId).select('-password').exec();
}
