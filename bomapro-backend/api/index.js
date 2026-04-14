'use strict';
require('reflect-metadata');
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');

const server = express();
let app;

async function bootstrap() {
  if (!app) {
    const { AppModule } = require('../dist/app.module');

    app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    await app.init();
  }
}

module.exports = async (req, res) => {
  await bootstrap();
  server(req, res);
};
