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
exports.PropertyTenantSchema = exports.PropertyTenant = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
let PropertyTenant = class PropertyTenant extends base_schema_1.BaseDocument {
};
exports.PropertyTenant = PropertyTenant;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "idNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "kraPin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "emergencyContactName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "emergencyContactPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "occupation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "employer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "currentPropertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "currentLeaseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PropertyTenant.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], PropertyTenant.prototype, "documents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], PropertyTenant.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "portalPassword", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PropertyTenant.prototype, "portalPasswordSet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PropertyTenant.prototype, "portalInviteToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], PropertyTenant.prototype, "portalInviteTokenExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PropertyTenant.prototype, "portalInviteTokenUsed", void 0);
exports.PropertyTenant = PropertyTenant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PropertyTenant);
exports.PropertyTenantSchema = mongoose_1.SchemaFactory.createForClass(PropertyTenant);
exports.PropertyTenantSchema.index({ tenantId: 1 });
exports.PropertyTenantSchema.index({ email: 1 });
exports.PropertyTenantSchema.index({ phone: 1 });
exports.PropertyTenantSchema.index({ idNumber: 1 });
exports.PropertyTenantSchema.index({ portalInviteToken: 1 });
//# sourceMappingURL=property-tenant.schema.js.map