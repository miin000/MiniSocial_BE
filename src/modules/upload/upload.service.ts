import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Create uploads directory if not exists
    if (!fs.existsSync(this.uploadDir)) {
      this.logger.log(`Creating uploads directory at: ${this.uploadDir}`);
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: any, userId: string): Promise<string> {
    try {
      // Create user-specific directory
      const userDir = path.join(this.uploadDir, 'avatars', userId);
      this.logger.debug(`Creating directory: ${userDir}`);
      
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(userDir, fileName);

      this.logger.debug(`Saving file to: ${filePath}`);
      
      // Save file
      fs.writeFileSync(filePath, file.buffer);
      this.logger.log(`File saved successfully: ${filePath}`);

      // Return relative URL 
      const relativeUrl = `/api/v1/uploads/avatars/${userId}/${fileName}`;
      return relativeUrl;
    } catch (error: any) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  deleteFile(filePath: string): void {
    try {
      const fullPath = path.join(this.uploadDir, filePath.replace('/uploads/', ''));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
