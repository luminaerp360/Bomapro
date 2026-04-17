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
exports.UnitSchema = exports.Unit = exports.RentCycle = exports.UnitType = exports.UnitStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var UnitStatus;
(function (UnitStatus) {
    UnitStatus["VACANT"] = "vacant";
    UnitStatus["OCCUPIED"] = "occupied";
    UnitStatus["MAINTENANCE"] = "maintenance";
    UnitStatus["RESERVED"] = "reserved";
})(UnitStatus || (exports.UnitStatus = UnitStatus = {}));
var UnitType;
(function (UnitType) {
    UnitType["BEDSITTER"] = "bedsitter";
    UnitType["SINGLE_ROOM"] = "single_room";
    UnitType["ONE_BEDROOM"] = "one_bedroom";
    UnitType["TWO_BEDROOM"] = "two_bedroom";
    UnitType["THREE_BEDROOM"] = "three_bedroom";
})(UnitType || (exports.UnitType = UnitType = {}));
var RentCycle;
(function (RentCycle) {
    RentCycle["MONTHLY"] = "monthly";
    RentCycle["QUARTERLY"] = "quarterly";
    RentCycle["ANNUAL"] = "annual";
})(RentCycle || (exports.RentCycle = RentCycle = {}));
let Unit = class Unit extends base_schema_1.BaseDocument {
};
exports.Unit = Unit;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Unit.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Unit.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Unit.prototype, "unitNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: UnitType, default: UnitType.ONE_BEDROOM }),
    __metadata("design:type", String)
], Unit.prototype, "unitType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.SchemaTypes.Mixed, required: false, default: 0 }),
    __metadata("design:type", Object)
], Unit.prototype, "floor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: UnitStatus, default: UnitStatus.VACANT }),
    __metadata("design:type", String)
], Unit.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Unit.prototype, "rentAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'KES' }),
    __metadata("design:type", String)
], Unit.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Unit.prototype, "securityDeposit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "electricityMeterNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "waterMeterNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: RentCycle, default: RentCycle.MONTHLY }),
    __metadata("design:type", String)
], Unit.prototype, "rentCycle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "currentTenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "currentLeaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Unit.prototype, "currentPropertyTenantId", void 0);
exports.Unit = Unit = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Unit);
exports.UnitSchema = mongoose_1.SchemaFactory.createForClass(Unit);
exports.UnitSchema.index({ tenantId: 1 });
exports.UnitSchema.index({ propertyId: 1 });
exports.UnitSchema.index({ status: 1 });
exports.UnitSchema.index({ unitNumber: 1, propertyId: 1 });
//# sourceMappingURL=unit.schema.js.map