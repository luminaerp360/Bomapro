import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGODB_URI');

        if (!mongoUri) {
          throw new Error('Missing MONGODB_URI environment variable');
        }

        return {
          uri: mongoUri,
          // Avoid long cold-start hangs in serverless environments.
          retryAttempts: 2,
          retryDelay: 1000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 10000,
        connectionFactory: (connection) => {
          connection.on('disconnected', () => {
            console.info('MongoDB disconnected! Attempting to reconnect...');
          });
          connection.on('error', (error) => {
            console.error('MongoDB connection error:', error.message);
          });
          connection.on('connected', () => {
            console.info('MongoDB connected successfully');
          });
          return connection;
        },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
