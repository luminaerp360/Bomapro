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
<<<<<<< HEAD
exports.BulkImportUnitsDto = exports.BulkImportUnitItemDto = exports.UpdateUnitDto = exports.CreateUnitDto = void 0;
=======
exports.UpdateUnitDto = exports.CreateUnitDto = void 0;
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
const unit_schema_1 = require("../schemas/unit.schema");
class CreateUnitDto {
}
exports.CreateUnitDto = CreateUnitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "propertyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "unitNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(unit_schema_1.UnitType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "unitType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateUnitDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateUnitDto.prototype, "rentAmount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateUnitDto.prototype, "securityDeposit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "electricityMeterNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "waterMeterNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(unit_schema_1.RentCycle),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "rentCycle", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(unit_schema_1.UnitStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUnitDto.prototype, "status", void 0);
class UpdateUnitDto extends (0, mapped_types_1.PartialType)(CreateUnitDto) {
}
exports.UpdateUnitDto = UpdateUnitDto;
<<<<<<< HEAD
class BulkImportUnitItemDto {
}
exports.BulkImportUnitItemDto = BulkImportUnitItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkImportUnitItemDto.prototype, "property", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkImportUnitItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BulkImportUnitItemDto.prototype, "rentAmount", void 0);
class BulkImportUnitsDto {
}
exports.BulkImportUnitsDto = BulkImportUnitsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], BulkImportUnitsDto.prototype, "units", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUnitsDto.prototype, "csvText", void 0);
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
//# sourceMappingURL=unit.dto.js.map