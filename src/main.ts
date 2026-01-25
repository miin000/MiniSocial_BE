import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS cho nhiều origins (Next.js Admin, Flutter Web, etc.)
  app.enableCors({
    origin: true, // Allow all origins temporarily for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
