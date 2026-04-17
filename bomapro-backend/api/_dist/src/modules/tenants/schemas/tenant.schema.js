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
exports.TenantSchema = exports.Tenant = exports.TenantPlan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var TenantPlan;
(function (TenantPlan) {
    TenantPlan["FREE"] = "free";
    TenantPlan["BASIC"] = "basic";
    TenantPlan["PRO"] = "pro";
    TenantPlan["ENTERPRISE"] = "enterprise";
})(TenantPlan || (exports.TenantPlan = TenantPlan = {}));
let Tenant = class Tenant extends base_schema_1.BaseDocument {
};
exports.Tenant = Tenant;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Tenant.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Tenant.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Tenant.prototype, "domain", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Tenant.prototype, "logoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Tenant.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: TenantPlan, default: TenantPlan.FREE }),
    __metadata("design:type", String)
], Tenant.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Tenant.prototype, "settings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Tenant.prototype, "ownerUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Tenant.prototype, "contactEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Tenant.prototype, "billingEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "maxUsers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "maxProperties", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Tenant.prototype, "mpesaClientId", void 0);
exports.Tenant = Tenant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Tenant);
exports.TenantSchema = mongoose_1.SchemaFactory.createForClass(Tenant);
exports.TenantSchema.index({ ownerUserId: 1 });
exports.TenantSchema.index({ isActive: 1 });
//# sourceMappingURL=tenant.schema.js.map