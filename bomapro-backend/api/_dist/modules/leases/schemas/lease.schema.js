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
exports.LeaseSchema = exports.Lease = exports.PaymentFrequency = exports.LeaseStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var LeaseStatus;
(function (LeaseStatus) {
    LeaseStatus["DRAFT"] = "draft";
    LeaseStatus["ACTIVE"] = "active";
    LeaseStatus["EXPIRED"] = "expired";
    LeaseStatus["TERMINATED"] = "terminated";
    LeaseStatus["RENEWED"] = "renewed";
})(LeaseStatus || (exports.LeaseStatus = LeaseStatus = {}));
var PaymentFrequency;
(function (PaymentFrequency) {
    PaymentFrequency["MONTHLY"] = "monthly";
    PaymentFrequency["QUARTERLY"] = "quarterly";
    PaymentFrequency["SEMI_ANNUALLY"] = "semi_annually";
    PaymentFrequency["ANNUALLY"] = "annually";
})(PaymentFrequency || (exports.PaymentFrequency = PaymentFrequency = {}));
let Lease = class Lease extends base_schema_1.BaseDocument {
};
exports.Lease = Lease;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Lease.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "unitId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Lease.prototype, "propertyTenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "leaseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: LeaseStatus, default: LeaseStatus.DRAFT }),
    __metadata("design:type", String)
], Lease.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Lease.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Lease.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Lease.prototype, "rentAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'KES' }),
    __metadata("design:type", String)
], Lease.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Lease.prototype, "depositAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Lease.prototype, "depositPaid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: PaymentFrequency, default: PaymentFrequency.MONTHLY }),
    __metadata("design:type", String)
], Lease.prototype, "paymentFrequency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 5 }),
    __metadata("design:type", Number)
], Lease.prototype, "paymentDueDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Lease.prototype, "lateFeeAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 5 }),
    __metadata("design:type", Number)
], Lease.prototype, "gracePeriodDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "terms", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Lease.prototype, "documents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Lease.prototype, "terminatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "terminationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "renewedFromLeaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "propertyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "propertyTenantName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Lease.prototype, "isSigned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Lease.prototype, "signedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Lease.prototype, "signedByPropertyTenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Lease.prototype, "scheduleGenerated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Lease.prototype, "scheduleGeneratedAt", void 0);
exports.Lease = Lease = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Lease);
exports.LeaseSchema = mongoose_1.SchemaFactory.createForClass(Lease);
exports.LeaseSchema.index({ tenantId: 1 });
exports.LeaseSchema.index({ propertyId: 1 });
exports.LeaseSchema.index({ unitId: 1 });
exports.LeaseSchema.index({ propertyTenantId: 1 });
exports.LeaseSchema.index({ status: 1 });
exports.LeaseSchema.index({ endDate: 1 });
//# sourceMappingURL=lease.schema.js.map