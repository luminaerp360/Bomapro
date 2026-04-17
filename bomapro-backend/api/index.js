'use strict';

const express = require('express');

// Optionally require reflect-metadata, but don't fail if it's missing
try {
  require('reflect-metadata');
  console.log('[Startup] reflect-metadata loaded');
} catch (e) {
  console.warn('[Startup] reflect-metadata not available, continuing anyway');
}

let cachedApp = null;
let initError = null;

async function createNestServer() {
  try {
    console.log('[App Init] ===== STARTING APP INITIALIZATION =====');
    console.log('[App Init] Loading NestJS modules...');
    const { NestFactory } = require('@nestjs/core');
    const { ExpressAdapter } = require('@nestjs/platform-express');
    const { ValidationPipe } = require('@nestjs/common');
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    
    console.log('[App Init] NestJS modules loaded, loading AppModule...');
    // Try to load from dist first, then fall back to relative paths
    let AppModule;
    try {
      AppModule = require('../dist/app.module').AppModule;
      console.log('[App Init] AppModule loaded from ../dist/app.module');
    } catch (e) {
      console.error('[App Init] Failed to load from ../dist/app.module:', e.message);
      try {
        AppModule = require('./dist/app.module').AppModule;
        console.log('[App Init] AppModule loaded from ./dist/app.module');
      } catch (e2) {
        console.error('[App Init] Failed to load from ./dist/app.module:', e2.message);
        throw new Error(`Could not load AppModule from any path`);
      }
    }

    console.log('[App Init] Creating Express server...');
    const server = express();
    
    console.log('[App Init] Creating NestJS app...');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn'],
    });

    console.log('[App Init] Configuring CORS...');
    app.enableCors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:4200',
        'http://localhost:4200',
        'https://bomapro-frontend.vercel.app',
      ],
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    app.setGlobalPrefix('api');

    console.log('[App Init] Setting up validation pipes...');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    console.log('[App Init] Setting up Swagger...');
    const config = new DocumentBuilder()
      .setTitle('Bomapro API')
      .setDescription('Rental Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log('[App Init] Initializing app...');
    await app.init();
    
    console.log('[App Init] ===== APP INITIALIZATION COMPLETE =====');
    return server;
  } catch (error) {
    console.error('[App Init] ===== FATAL ERROR =====');
    console.error('[App Init] Error:', error.message);
    console.error('[App Init] Type:', error.constructor.name);
    console.error('[App Init] Stack:', error.stack);
    initError = error;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (initError) {
      console.log('[Handler] Clearing previous error and retrying...');
      cachedApp = null;
      initError = null;
    }

    if (!cachedApp) {
      console.log('[Handler] ===== FIRST REQUEST - INITIALIZING APP =====');
      console.log('[Handler] Method:', req.method, 'URL:', req.url);
      cachedApp = await createNestServer();
    }

    console.log('[Handler] Routing:', req.method, req.url);
    return cachedApp(req, res);
  } catch (error) {
    console.error('[Handler] ===== REQUEST FAILED =====');
    console.error('[Handler] Error message:', error.message);
    console.error('[Handler] Error type:', error.constructor.name);
    console.error('[Handler] Stack:', error.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      type: error.constructor.name,
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
