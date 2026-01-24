// src/users/dto/update-user.dto.ts
import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {

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
}