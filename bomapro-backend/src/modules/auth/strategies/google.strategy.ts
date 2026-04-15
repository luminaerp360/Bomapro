import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'google-oauth-disabled';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'google-oauth-disabled';

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn(
        'Google OAuth is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3400/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      avatar: photos?.[0]?.value || '',
    };
    done(null, user);
  }
}
