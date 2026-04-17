import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Request, Response } from 'express';

let cachedApp: any = null;
let initError: any = null;

async function createNestServer() {
  try {
    console.log('[Serverless] Creating NestJS app instance...');
    
    // Dynamically import the compiled AppModule at runtime
    const { AppModule } = await import('../dist/app.module');

    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn', 'log'],
    });

    console.log('[Serverless] Configuring Express middlewares...');

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

    console.log('[Serverless] Setting up Swagger documentation...');
    const config = new DocumentBuilder()
      .setTitle('Bomapro API')
      .setDescription('Rental Management System API for the Kenyan Market')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log('[Serverless] Initializing app...');
    await app.init();
    console.log('[Serverless] ✓ NestJS app initialized successfully');
    return server;
  } catch (error) {
    console.error('[Serverless] ✗ Failed to initialize NestJS app:', error);
    initError = error;
    throw error;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    // Reset error state if it was previously set
    if (initError) {
      console.log('[Handler] Resetting cached app due to previous error...');
      cachedApp = null;
      initError = null;
    }

    if (!cachedApp) {
      console.log('[Handler] Creating new NestJS server instance on first request...');
      cachedApp = await createNestServer();
    }

    console.log(`[Handler] Routing ${req.method} ${req.url}`);
    return cachedApp(req, res);
  } catch (error) {
    console.error('[Handler] ✗ Request failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
