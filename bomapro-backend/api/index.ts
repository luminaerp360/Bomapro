import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

let cachedApp: any = null;

async function createNestServer() {
  try {
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
    console.log('[Serverless] NestJS app initialized successfully');
    return server;
  } catch (error) {
    console.error('[Serverless] Failed to initialize app:', error);
    throw error;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!cachedApp) {
      console.log('[Serverless] Creating new NestJS server instance');
      cachedApp = await createNestServer();
    }

    cachedApp(req, res);
  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({ error: 'Internal Server Error', message: String(error) });
  }
}
