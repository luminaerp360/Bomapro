"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const payment_schema_1 = require("./schemas/payment.schema");
const payment_repository_1 = require("./repositories/payment.repository");
const rent_schedules_module_1 = require("../rent-schedules/rent-schedules.module");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
                { name: property_tenant_schema_1.PropertyTenant.name, schema: property_tenant_schema_1.PropertyTenantSchema },
            ]),
            rent_schedules_module_1.RentSchedulesModule,
        ],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService, payment_repository_1.PaymentRepository],
        exports: [payments_service_1.PaymentsService, payment_repository_1.PaymentRepository],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map