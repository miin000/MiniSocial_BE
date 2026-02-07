import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateReportDto {
    @IsString()
    reporter_id: string;

    @IsOptional()
    @IsString()
    reported_id?: string;

    @IsOptional()
    @IsString()
    reported_post_id?: string;

    @IsString()
    type: string; // 'post', 'user', 'comment'

    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    evidence_urls?: string[];
}
