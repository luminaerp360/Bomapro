/**
 * Vercel Serverless Handler for Bomapro Backend
 * 
 * This is the entry point for all API requests on Vercel.
 * It creates and caches a NestJS application instance across invocations
 * for performance, and handles all routing through the Express adapter.
 * 
 * CRITICAL: This file must remain in api/ directory and be named index.js
 * for Vercel to recognize it as a serverless function.
 */

require('reflect-metadata');

const express = require('express');
const path = require('path');

let cachedApp = null;
let lastError = null;

/**
 * Initialize the NestJS application with all middleware and modules
 */
async function initializeApp() {
  try {
    // Lazy load NestJS modules to minimize startup time
    const { NestFactory } = require('@nestjs/core');
    const { ExpressAdapter } = require('@nestjs/platform-express');
    const { ValidationPipe } = require('@nestjs/common');
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

    // Load the compiled AppModule from dist
    let AppModule;
    try {
      AppModule = require('../dist/app.module').AppModule;
    } catch (e) {
      console.error('[Handler] Failed to load AppModule from ../dist/app.module:', e.message);
      // Try alternative path
      AppModule = require('./dist/app.module').AppModule;
    }

    // Create Express server that will be wrapped by NestJS
    const server = express();

    // Initialize NestJS with the Express adapter
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn'],
    });

    // Setup CORS for frontend
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

    // Set API prefix
    app.setGlobalPrefix('api');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    // Setup Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Bomapro API')
      .setDescription('Rental Management System API for the Kenyan Market')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Initialize the app
    await app.init();

    console.log('[Handler] NestJS application initialized successfully');
    return server;
  } catch (error) {
    console.error('[Handler] Failed to initialize NestJS app:');
    console.error('[Handler] Error:', error.message);
    console.error('[Handler] Stack:', error.stack);
    throw error;
  }
}

/**
 * Main serverless handler function called by Vercel
 */
module.exports = async function handler(req, res) {
  try {
    // On first request, initialize the app and cache it for subsequent requests
    if (!cachedApp) {
      console.log('[Handler] First request - initializing NestJS app');
      cachedApp = await initializeApp();
      lastError = null;
    } else if (lastError) {
      // If there was a previous error, clear it and reinitialize
      console.log('[Handler] Clearing previous error and reinitializing');
      cachedApp = null;
      lastError = null;
      cachedApp = await initializeApp();
    }

    // Route the request through the cached Express/NestJS app
    console.log(`[Handler] Routing: ${req.method} ${req.url}`);
    return cachedApp(req, res);
  } catch (error) {
    lastError = error;
    console.error('[Handler] Request failed:', error.message);
    console.error('[Handler] Stack:', error.stack);

    // Return error response
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error.message,
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
