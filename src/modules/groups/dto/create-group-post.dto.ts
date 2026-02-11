import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateGroupPostDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[];

  @IsOptional()
  @IsString()
  content_type?: string;
}
