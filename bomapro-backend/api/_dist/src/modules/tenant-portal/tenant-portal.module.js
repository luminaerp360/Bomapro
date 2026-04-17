"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPortalModule = void 0;
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
const damage_schema_1 = require("../damages/schemas/damage.schema");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const tenant_portal_controller_1 = require("./tenant-portal.controller");
const tenant_portal_service_1 = require("./tenant-portal.service");
const mpesa_service_1 = require("./mpesa.service");
const tenant_portal_jwt_strategy_1 = require("./strategies/tenant-portal-jwt.strategy");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
let TenantPortalModule = class TenantPortalModule {
};
exports.TenantPortalModule = TenantPortalModule;
exports.TenantPortalModule = TenantPortalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: property_tenant_schema_1.PropertyTenant.name, schema: property_tenant_schema_1.PropertyTenantSchema },
                { name: lease_schema_1.Lease.name, schema: lease_schema_1.LeaseSchema },
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
                { name: unit_schema_1.Unit.name, schema: unit_schema_1.UnitSchema },
                { name: tenant_schema_1.Tenant.name, schema: tenant_schema_1.TenantSchema },
                { name: damage_schema_1.Damage.name, schema: damage_schema_1.DamageSchema },
            ]),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: () => ({
                    secret: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
                    signOptions: { expiresIn: '7d' },
                }),
            }),
        ],
        controllers: [tenant_portal_controller_1.TenantPortalController],
        providers: [tenant_portal_service_1.TenantPortalService, mpesa_service_1.MpesaService, tenant_portal_jwt_strategy_1.TenantPortalJwtStrategy],
        exports: [tenant_portal_service_1.TenantPortalService],
    })
], TenantPortalModule);
//# sourceMappingURL=tenant-portal.module.js.map