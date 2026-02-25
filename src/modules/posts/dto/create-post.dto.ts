import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum CreatePostVisibility {
    PUBLIC = 'public',
    FRIENDS = 'friends',
    PRIVATE = 'private',
}

export class CreatePostDto {
    @IsString()
    user_id: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    media_urls?: string[];

    @IsOptional()
    @IsString()
    content_type?: string;

    @IsOptional()
    @IsEnum(CreatePostVisibility)
    visibility?: CreatePostVisibility;

    @IsOptional()
    @IsString()
    group_id?: string;
}
