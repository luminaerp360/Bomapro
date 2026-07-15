"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const tenants_service_1 = require("./tenants.service");
const tenants_controller_1 = require("./tenants.controller");
const tenant_schema_1 = require("./schemas/tenant.schema");
const tenant_repository_1 = require("./repositories/tenant.repository");
const auth_module_1 = require("../auth/auth.module");
let TenantsModule = class TenantsModule {
};
exports.TenantsModule = TenantsModule;
exports.TenantsModule = TenantsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: tenant_schema_1.Tenant.name, schema: tenant_schema_1.TenantSchema }]),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
        ],
        controllers: [tenants_controller_1.TenantsController],
        providers: [tenants_service_1.TenantsService, tenant_repository_1.TenantRepository],
        exports: [tenants_service_1.TenantsService, tenant_repository_1.TenantRepository],
    })
], TenantsModule);
//# sourceMappingURL=tenants.module.js.map