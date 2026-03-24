import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa a validação global e remove campos indesejados (whitelist)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Habilita CORS (necessário para o Front-end Next.js conseguir bater na API)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
