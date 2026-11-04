const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./_dist/app.module');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;

async function getApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule);
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
  SwaggerModule.setup('docs', app, document);

  await app.init();
  return app;
}

module.exports = async (req, res) => {
  try {
    const nestApp = await getApp();
    const instance = nestApp.getHttpAdapter().getInstance();
    instance(req, res);
  } catch (error) {
    console.error('[Vercel Handler Error]', error.message, error.stack);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
