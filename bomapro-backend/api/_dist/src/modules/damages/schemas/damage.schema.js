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
exports.DamageSchema = exports.Damage = exports.DamageType = exports.DamageSeverity = exports.DamageStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var DamageStatus;
(function (DamageStatus) {
    DamageStatus["REPORTED"] = "reported";
    DamageStatus["ASSESSED"] = "assessed";
    DamageStatus["IN_REPAIR"] = "in_repair";
    DamageStatus["REPAIRED"] = "repaired";
    DamageStatus["DEDUCTED"] = "deducted";
    DamageStatus["CLOSED"] = "closed";
})(DamageStatus || (exports.DamageStatus = DamageStatus = {}));
var DamageSeverity;
(function (DamageSeverity) {
    DamageSeverity["LOW"] = "low";
    DamageSeverity["MEDIUM"] = "medium";
    DamageSeverity["HIGH"] = "high";
    DamageSeverity["CRITICAL"] = "critical";
})(DamageSeverity || (exports.DamageSeverity = DamageSeverity = {}));
var DamageType;
(function (DamageType) {
    DamageType["STRUCTURAL"] = "structural";
    DamageType["PLUMBING"] = "plumbing";
    DamageType["ELECTRICAL"] = "electrical";
    DamageType["APPLIANCE"] = "appliance";
    DamageType["COSMETIC"] = "cosmetic";
    DamageType["FIXTURE"] = "fixture";
    DamageType["FLOORING"] = "flooring";
    DamageType["WINDOW_DOOR"] = "window_door";
    DamageType["OTHER"] = "other";
})(DamageType || (exports.DamageType = DamageType = {}));
let Damage = class Damage extends base_schema_1.BaseDocument {
};
exports.Damage = Damage;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Damage.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Damage.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "propertyTenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "leaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Damage.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: DamageType, default: DamageType.OTHER }),
    __metadata("design:type", String)
], Damage.prototype, "damageType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: DamageSeverity, default: DamageSeverity.MEDIUM }),
    __metadata("design:type", String)
], Damage.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: DamageStatus, default: DamageStatus.REPORTED }),
    __metadata("design:type", String)
], Damage.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Damage.prototype, "estimatedCost", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Damage.prototype, "actualCost", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'KES' }),
    __metadata("design:type", String)
], Damage.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Damage.prototype, "reportedDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Damage.prototype, "assessedDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Damage.prototype, "repairedDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Damage.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "repairVendor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Damage.prototype, "deductedFromDeposit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "propertyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "propertyTenantName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Damage.prototype, "reportedBy", void 0);
exports.Damage = Damage = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Damage);
exports.DamageSchema = mongoose_1.SchemaFactory.createForClass(Damage);
exports.DamageSchema.index({ tenantId: 1 });
exports.DamageSchema.index({ propertyId: 1 });
exports.DamageSchema.index({ propertyTenantId: 1 });
exports.DamageSchema.index({ status: 1 });
exports.DamageSchema.index({ severity: 1 });
//# sourceMappingURL=damage.schema.js.map