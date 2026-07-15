"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyTenantsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const property_tenants_service_1 = require("./property-tenants.service");
const property_tenants_controller_1 = require("./property-tenants.controller");
const property_tenant_schema_1 = require("./schemas/property-tenant.schema");
const property_tenant_repository_1 = require("./repositories/property-tenant.repository");
const tenant_portal_module_1 = require("../tenant-portal/tenant-portal.module");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
let PropertyTenantsModule = class PropertyTenantsModule {
};
exports.PropertyTenantsModule = PropertyTenantsModule;
exports.PropertyTenantsModule = PropertyTenantsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: property_tenant_schema_1.PropertyTenant.name, schema: property_tenant_schema_1.PropertyTenantSchema },
                { name: lease_schema_1.Lease.name, schema: lease_schema_1.LeaseSchema },
                { name: unit_schema_1.Unit.name, schema: unit_schema_1.UnitSchema },
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
            ]),
            (0, common_1.forwardRef)(() => tenant_portal_module_1.TenantPortalModule),
        ],
        controllers: [property_tenants_controller_1.PropertyTenantsController],
        providers: [property_tenants_service_1.PropertyTenantsService, property_tenant_repository_1.PropertyTenantRepository],
        exports: [property_tenants_service_1.PropertyTenantsService, property_tenant_repository_1.PropertyTenantRepository],
    })
], PropertyTenantsModule);
//# sourceMappingURL=property-tenants.module.js.map