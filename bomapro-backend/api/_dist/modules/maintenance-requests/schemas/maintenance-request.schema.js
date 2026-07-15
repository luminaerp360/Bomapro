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
exports.MaintenanceRequestSchema = exports.MaintenanceRequest = exports.MaintenanceRequestPriority = exports.MaintenanceRequestStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var MaintenanceRequestStatus;
(function (MaintenanceRequestStatus) {
    MaintenanceRequestStatus["PENDING"] = "pending";
    MaintenanceRequestStatus["IN_PROGRESS"] = "in_progress";
    MaintenanceRequestStatus["RESOLVED"] = "resolved";
    MaintenanceRequestStatus["CLOSED"] = "closed";
    MaintenanceRequestStatus["REJECTED"] = "rejected";
})(MaintenanceRequestStatus || (exports.MaintenanceRequestStatus = MaintenanceRequestStatus = {}));
var MaintenanceRequestPriority;
(function (MaintenanceRequestPriority) {
    MaintenanceRequestPriority["LOW"] = "low";
    MaintenanceRequestPriority["MEDIUM"] = "medium";
    MaintenanceRequestPriority["HIGH"] = "high";
    MaintenanceRequestPriority["URGENT"] = "urgent";
})(MaintenanceRequestPriority || (exports.MaintenanceRequestPriority = MaintenanceRequestPriority = {}));
let MaintenanceRequest = class MaintenanceRequest extends base_schema_1.BaseDocument {
};
exports.MaintenanceRequest = MaintenanceRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "propertyTenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "unitId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "propertyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: MaintenanceRequestStatus, default: MaintenanceRequestStatus.PENDING }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: MaintenanceRequestPriority, default: MaintenanceRequestPriority.MEDIUM }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MaintenanceRequest.prototype, "attachments", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "assignedToUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MaintenanceRequest.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "completionNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "propertyTenantName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], MaintenanceRequest.prototype, "unitNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], MaintenanceRequest.prototype, "dueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], MaintenanceRequest.prototype, "estimatedCost", void 0);
exports.MaintenanceRequest = MaintenanceRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MaintenanceRequest);
exports.MaintenanceRequestSchema = mongoose_1.SchemaFactory.createForClass(MaintenanceRequest);
exports.MaintenanceRequestSchema.index({ tenantId: 1 });
exports.MaintenanceRequestSchema.index({ propertyTenantId: 1 });
exports.MaintenanceRequestSchema.index({ unitId: 1 });
exports.MaintenanceRequestSchema.index({ propertyId: 1 });
exports.MaintenanceRequestSchema.index({ status: 1 });
exports.MaintenanceRequestSchema.index({ createdAt: -1 });
//# sourceMappingURL=maintenance-request.schema.js.map