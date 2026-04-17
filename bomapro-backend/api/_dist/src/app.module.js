"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./modules/database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const properties_module_1 = require("./modules/properties/properties.module");
const units_module_1 = require("./modules/units/units.module");
const property_tenants_module_1 = require("./modules/property-tenants/property-tenants.module");
const leases_module_1 = require("./modules/leases/leases.module");
const payments_module_1 = require("./modules/payments/payments.module");
const damages_module_1 = require("./modules/damages/damages.module");
const reports_module_1 = require("./modules/reports/reports.module");
const tenant_portal_module_1 = require("./modules/tenant-portal/tenant-portal.module");
const maintenance_requests_module_1 = require("./modules/maintenance-requests/maintenance-requests.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            properties_module_1.PropertiesModule,
            units_module_1.UnitsModule,
            property_tenants_module_1.PropertyTenantsModule,
            leases_module_1.LeasesModule,
            payments_module_1.PaymentsModule,
            damages_module_1.DamagesModule,
            reports_module_1.ReportsModule,
            tenant_portal_module_1.TenantPortalModule,
            maintenance_requests_module_1.MaintenanceRequestsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map