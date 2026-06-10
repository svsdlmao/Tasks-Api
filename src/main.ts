import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the Angular dev server (localhost:4200) to call this API.
  app.enableCors({ origin: true, credentials: true });

  // Validate & strip unknown fields from incoming request bodies.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(3000);
  console.log('✅ Tasks API running on http://localhost:3000');
}
bootstrap();
