import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RentiumUser } from '../schemas/rentium-user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(RentiumUser.name) private userModel: Model<RentiumUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'bomapro-secret-change-me',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).lean();
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
<<<<<<< HEAD
      role: payload.role,
=======
      role: user?.role || payload.role,
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
      tenantId: user?.activeTenantId || payload.tenantId || '',
      tenantIds: user?.tenantIds || payload.tenantIds || [],
    };
  }
}
