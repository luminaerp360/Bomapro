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
exports.RentScheduleSchema = exports.RentSchedule = exports.ScheduleStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["UNPAID"] = "unpaid";
    ScheduleStatus["PARTIAL"] = "partial";
    ScheduleStatus["PAID"] = "paid";
    ScheduleStatus["OVERDUE"] = "overdue";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
let RentSchedule = class RentSchedule extends base_schema_1.BaseDocument {
};
exports.RentSchedule = RentSchedule;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentSchedule.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentSchedule.prototype, "leaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentSchedule.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentSchedule.prototype, "unitId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], RentSchedule.prototype, "dueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], RentSchedule.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], RentSchedule.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ScheduleStatus, default: ScheduleStatus.UNPAID }),
    __metadata("design:type", String)
], RentSchedule.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], RentSchedule.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], RentSchedule.prototype, "dueWithGracePeriodDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], RentSchedule.prototype, "lateFeeApplied", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], RentSchedule.prototype, "payments", void 0);
exports.RentSchedule = RentSchedule = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RentSchedule);
exports.RentScheduleSchema = mongoose_1.SchemaFactory.createForClass(RentSchedule);
//# sourceMappingURL=rent-schedule.schema.js.map