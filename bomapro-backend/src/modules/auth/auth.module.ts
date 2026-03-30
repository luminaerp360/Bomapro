import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { InitController } from './init.controller';
import { RentiumUser, RentiumUserSchema } from './schemas/rentium-user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailService } from './email.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentiumUser.name, schema: RentiumUserSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'bomapro-secret-change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    forwardRef(() => TenantsModule),
  ],
  controllers: [AuthController, InitController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, EmailService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
