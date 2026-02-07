import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    user_id: string;

    @IsString()
    post_id: string;

    @IsOptional()
    @IsString()
    parent_id?: string;

    @IsString()
    content: string;
}
