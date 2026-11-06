"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentSchedulesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const rent_schedules_service_1 = require("./rent-schedules.service");
const rent_schedules_controller_1 = require("./rent-schedules.controller");
const rent_schedule_schema_1 = require("./schemas/rent-schedule.schema");
const rent_schedule_repository_1 = require("./repositories/rent-schedule.repository");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
let RentSchedulesModule = class RentSchedulesModule {
};
exports.RentSchedulesModule = RentSchedulesModule;
exports.RentSchedulesModule = RentSchedulesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: rent_schedule_schema_1.RentSchedule.name, schema: rent_schedule_schema_1.RentScheduleSchema },
                { name: lease_schema_1.Lease.name, schema: lease_schema_1.LeaseSchema },
                { name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema },
                { name: unit_schema_1.Unit.name, schema: unit_schema_1.UnitSchema },
                { name: property_tenant_schema_1.PropertyTenant.name, schema: property_tenant_schema_1.PropertyTenantSchema },
            ]),
        ],
        controllers: [rent_schedules_controller_1.RentSchedulesController],
        providers: [rent_schedules_service_1.RentSchedulesService, rent_schedule_repository_1.RentScheduleRepository],
        exports: [rent_schedules_service_1.RentSchedulesService, rent_schedule_repository_1.RentScheduleRepository],
    })
], RentSchedulesModule);
//# sourceMappingURL=rent-schedules.module.js.map