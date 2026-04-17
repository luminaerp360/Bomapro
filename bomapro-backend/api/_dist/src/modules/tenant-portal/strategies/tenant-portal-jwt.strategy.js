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
exports.TenantPortalJwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
let TenantPortalJwtStrategy = class TenantPortalJwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'tenant-portal-jwt') {
    constructor() {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
        });
    }
    async validate(payload) {
        if (payload.type !== 'tenant-portal') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            orgTenantId: payload.orgTenantId,
        };
    }
};
exports.TenantPortalJwtStrategy = TenantPortalJwtStrategy;
exports.TenantPortalJwtStrategy = TenantPortalJwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TenantPortalJwtStrategy);
//# sourceMappingURL=tenant-portal-jwt.strategy.js.map