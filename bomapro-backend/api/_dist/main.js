"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
<<<<<<< HEAD
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
    httpAdapter.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bomapro API')
        .setDescription('Rental Management System API for the Kenyan Market')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3400;
    await app.listen(port);
    console.log(`Bomapro API running on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map