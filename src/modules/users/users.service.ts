
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

    // Admin methods
    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().select('-password').exec();
    }

    async updateUser(id: string, updateData: Partial<CreateUserDto>): Promise<UserDocument> {
        const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    async deleteUser(id: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new Error('User not found');
        }
    }

    // Block/Unblock user methods
    async blockUser(id: string): Promise<UserDocument> {
        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            { status: 'BLOCKED' },
            { new: true }
        ).select('-password').exec();
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    async unblockUser(id: string): Promise<UserDocument> {
        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            { status: 'ACTIVE' },
            { new: true }
        ).select('-password').exec();
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    }

    // async getProfile(userId: string): Promise<User> {
    //     const user = await this.userModel.findById(userId).select('-password').exec();
}
