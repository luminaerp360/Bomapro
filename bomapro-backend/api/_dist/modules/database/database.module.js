"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const mongoUri = configService.get('MONGODB_URI');
                    if (!mongoUri) {
                        throw new Error('Missing MONGODB_URI environment variable');
                    }
                    return {
                        uri: mongoUri,
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
], DatabaseModule);
//# sourceMappingURL=database.module.js.map