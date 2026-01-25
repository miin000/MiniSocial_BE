// src/users/dto/update-user.dto.ts
import { IsString, IsOptional, IsUrl, IsNotEmpty, IsEmail, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { UserStatus } from '../schemas/user.scheme';

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    full_name?: string;

    @IsString()
    @IsOptional()
    avatar_url?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

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

    @IsOptional()
    preferences?: {
        email_notifications?: boolean;
        two_factor_auth?: boolean;
        activity_alerts?: boolean;
    };

    @IsString()
    @IsOptional()
    password?: string;
}