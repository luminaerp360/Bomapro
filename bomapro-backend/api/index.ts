import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

let cachedHandler: ((req: Request, res: Response) => void) | null = null;

async function createNestServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bomapro API')
    .setDescription('Rental Management System API for the Kenyan Market')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response) {
  if (!cachedHandler) {
    cachedHandler = await createNestServer();
  }

  return cachedHandler(req, res);
}
