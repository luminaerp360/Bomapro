"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    constructor() {
        const clientID = process.env.GOOGLE_CLIENT_ID || 'google-oauth-disabled';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'google-oauth-disabled';
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.warn('Google OAuth is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.');
        }
        super({
            clientID,
            clientSecret,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3400/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }
    async validate(accessToken, refreshToken, profile, done) {
        const { id, name, emails, photos } = profile;
        const user = {
            googleId: id,
            email: emails?.[0]?.value || '',
            name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
            avatar: photos?.[0]?.value || '',
        };
        done(null, user);
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map