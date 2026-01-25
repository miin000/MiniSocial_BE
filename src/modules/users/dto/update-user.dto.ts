// src/users/dto/update-user.dto.ts
import { IsString, IsOptional, IsUrl, IsNotEmpty, IsEmail, IsArray, IsEnum } from 'class-validator';
import { UserStatus } from '../schemas/user.scheme';

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    username: string;

    @IsString()
    @IsOptional()
    full_name?: string;

    @IsUrl()
    @IsOptional()
    avatar_url?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    birthdate?: Date;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roles_admin?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roles_group?: string[];

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}