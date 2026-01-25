import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private uploadService: UploadService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any, @Request() req: any) {
    const userId = String(req.user?.user_id);
    this.logger.debug(`Attempting to upload avatar for user: ${userId}`);
    
    if (!file) {
      this.logger.warn('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      this.logger.warn(`Invalid file type: ${file.mimetype}`);
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.logger.warn(`File too large: ${file.size} bytes`);
      throw new BadRequestException('File size must not exceed 5MB');
    }

    try {
      // Upload file and return URL
      const url = await this.uploadService.uploadFile(file, userId);
      this.logger.log(`Avatar uploaded successfully for user ${userId}: ${url}`);
      return { url };
    } catch (error: any) {
      this.logger.error(`Avatar upload failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
