import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const { port, corsOrigin } = configService.getOrThrow<AppConfig>('app');

  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
}
void bootstrap();
