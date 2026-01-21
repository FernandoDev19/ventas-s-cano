import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SeedersService } from './seeders/seeders.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seeders
  const seedersService = app.get(SeedersService);
  await seedersService.run();

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  }))

  app.enableCors({
    origin: ['https'],
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Listen
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
