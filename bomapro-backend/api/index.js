'use strict';

const express = require('express');

let cachedApp = null;
let initError = null;

async function createNestServer() {
  try {
    // Require reflect-metadata first (needed by NestJS)
    require('reflect-metadata');

    const { NestFactory } = require('@nestjs/core');
    const { ExpressAdapter } = require('@nestjs/platform-express');
    const { ValidationPipe } = require('@nestjs/common');
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    const { AppModule } = require('../dist/src/app.module');

    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn', 'log'],
    });

    // CORS - allow deployed frontend and localhost
    app.enableCors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:4200',
        'http://localhost:4200',
        'https://bomapro-frontend.vercel.app',
        /\.vercel\.app$/,
      ],
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

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
    console.error('[Serverless] Failed to initialize NestJS app:', error);
    initError = error;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (initError) {
      // Reset so we can retry
      cachedApp = null;
      initError = null;
    }

    if (!cachedApp) {
      console.log('[Serverless] Creating new NestJS server instance...');
      cachedApp = await createNestServer();
    }

    return cachedApp(req, res);
  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Server initialization failed' : String(error),
    });
  }
};
