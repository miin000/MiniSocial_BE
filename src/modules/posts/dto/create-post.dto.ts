import { IsString, IsOptional, IsArray } from 'class-validator';

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
}
