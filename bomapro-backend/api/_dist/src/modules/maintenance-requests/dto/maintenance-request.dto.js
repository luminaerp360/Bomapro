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
exports.CompleteMaintenanceRequestDto = exports.UpdateMaintenanceRequestDto = exports.CreateMaintenanceRequestDto = void 0;
const class_validator_1 = require("class-validator");
const maintenance_request_schema_1 = require("../schemas/maintenance-request.schema");
class CreateMaintenanceRequestDto {
}
exports.CreateMaintenanceRequestDto = CreateMaintenanceRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRequestDto.prototype, "unitId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRequestDto.prototype, "propertyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(maintenance_request_schema_1.MaintenanceRequestPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMaintenanceRequestDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMaintenanceRequestDto.prototype, "attachments", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateMaintenanceRequestDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMaintenanceRequestDto.prototype, "estimatedCost", void 0);
class UpdateMaintenanceRequestDto {
}
exports.UpdateMaintenanceRequestDto = UpdateMaintenanceRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(maintenance_request_schema_1.MaintenanceRequestStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(maintenance_request_schema_1.MaintenanceRequestPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "assignedToUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMaintenanceRequestDto.prototype, "completionNotes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateMaintenanceRequestDto.prototype, "attachments", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateMaintenanceRequestDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMaintenanceRequestDto.prototype, "estimatedCost", void 0);
class CompleteMaintenanceRequestDto {
}
exports.CompleteMaintenanceRequestDto = CompleteMaintenanceRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMaintenanceRequestDto.prototype, "completionNotes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CompleteMaintenanceRequestDto.prototype, "attachments", void 0);
//# sourceMappingURL=maintenance-request.dto.js.map