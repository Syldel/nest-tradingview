import { NestFactory } from '@nestjs/core';
import { LogLevel } from '@nestjs/common';

import { AppModule } from './app.module';
import { CustomLogger } from '@services/custom-logger.service';

async function bootstrap() {
  const logger = new CustomLogger();
  const app = await NestFactory.create(AppModule, { logger });

  const isProduction = process.env.NODE_ENV === 'production';

  // INFO: Avec origin: '*', il faut normalement mettre => credentials: false
  let origin: string | string[];
  if (isProduction) {
    origin = process.env.ALLOWED_ORIGINS.split(',');
  } else {
    origin = ['http://localhost:3000', 'http://localhost:3001'];
  }

  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  /* ********************************************** */

  const levels: LogLevel[] = isProduction
    ? ['error', 'warn']
    : ['log', 'debug', 'warn', 'error'];

  logger.setLogLevels(levels);
  app.useLogger(levels);

  /* ********************************************** */

  const port = parseInt(process.env.PORT || '') || 3000;
  await app.listen(port);
  logger.log(`✨ App running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
