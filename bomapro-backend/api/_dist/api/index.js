"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
let cachedApp = null;
let initError = null;
async function createNestServer() {
    try {
        console.log('[Serverless] Creating NestJS app instance...');
        let AppModule = null;
        const possiblePaths = [
            '../dist/app.module',
            './dist/app.module',
            './src/app.module',
        ];
        for (const path of possiblePaths) {
            try {
                console.log(`[Serverless] Trying to load from: ${path}`);
                AppModule = require(path).AppModule;
                console.log(`[Serverless] Successfully loaded from: ${path}`);
                break;
            }
            catch (e) {
                console.log(`[Serverless] Failed to load from ${path}: ${e.message}`);
            }
        }
        if (!AppModule) {
            throw new Error('Could not find AppModule in any expected location');
        }
        const server = (0, express_1.default)();
        const app = await core_1.NestFactory.create(AppModule, new platform_express_1.ExpressAdapter(server), {
            logger: ['error', 'warn', 'log'],
        });
        console.log('[Serverless] Configuring Express middlewares...');
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
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
        }));
        console.log('[Serverless] Setting up Swagger documentation...');
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Bomapro API')
            .setDescription('Rental Management System API for the Kenyan Market')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
        console.log('[Serverless] Initializing app...');
        await app.init();
        console.log('[Serverless] ✓ NestJS app initialized successfully');
        return server;
    }
    catch (error) {
        console.error('[Serverless] ✗ Failed to initialize NestJS app:', error);
        initError = error;
        throw error;
    }
}
async function handler(req, res) {
    try {
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
    }
    catch (error) {
        console.error('[Handler] ✗ Request failed:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
    }
}
//# sourceMappingURL=index.js.map