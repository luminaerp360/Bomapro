'use strict';

// CRITICAL: Must require reflect-metadata FIRST before any NestJS imports
require('reflect-metadata');

const express = require('express');
const path = require('path');

let cachedApp = null;
let initError = null;

async function createNestServer() {
  try {
    console.log('[Serverless] Requiring NestJS modules...');
    const { NestFactory } = require('@nestjs/core');
    const { ExpressAdapter } = require('@nestjs/platform-express');
    const { ValidationPipe } = require('@nestjs/common');
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    
    console.log('[Serverless] Loading AppModule...');
    // Try to load from dist first, then fall back to relative paths
    let AppModule;
    try {
      AppModule = require('../dist/app.module').AppModule;
    } catch (e) {
      console.warn('[Serverless] Failed to load from ../dist/app.module, trying alternative paths');
      console.warn('[Serverless] Error:', e.message);
      try {
        AppModule = require('./dist/app.module').AppModule;
      } catch (e2) {
        console.error('[Serverless] Alternative path also failed');
        throw new Error(`Could not load AppModule: ${e.message}`);
      }
    }
    console.log('[Serverless] AppModule loaded successfully');

    const server = express();
    console.log('[Serverless] Creating NestJS app with ExpressAdapter...');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn', 'log'],
    });

    console.log('[Serverless] Configuring CORS...');
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

    console.log('[Serverless] Setting up validation pipes...');
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

    console.log('[Serverless] Initializing NestJS app...');
    await app.init();
    console.log('[Serverless] ✓✓✓ NestJS app initialized successfully ✓✓✓');
    return server;
  } catch (error) {
    console.error('[Serverless] ✗✗✗ FATAL ERROR initializing app ✗✗✗');
    console.error('[Serverless] Error stack:', error.stack);
    console.error('[Serverless] Error:', error);
    initError = error;
    throw error;
  }
}

module.exports = async function handler(req, res) {
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
};
  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Server initialization failed' : String(error),
    });
  }
};
