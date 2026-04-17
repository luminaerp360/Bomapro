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
exports.PropertySchema = exports.Property = exports.PropertyStatus = exports.PropertyType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const base_schema_1 = require("../../database/schemas/base.schema");
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "apartment";
    PropertyType["HOUSE"] = "house";
    PropertyType["COMMERCIAL"] = "commercial";
    PropertyType["LAND"] = "land";
    PropertyType["BEDSITTER"] = "bedsitter";
    PropertyType["SINGLE_ROOM"] = "single_room";
    PropertyType["ONE_BEDROOM"] = "one_bedroom";
    PropertyType["TWO_BEDROOM"] = "two_bedroom";
    PropertyType["THREE_BEDROOM"] = "three_bedroom";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["ACTIVE"] = "active";
    PropertyStatus["INACTIVE"] = "inactive";
    PropertyStatus["MAINTENANCE"] = "maintenance";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
let Property = class Property extends base_schema_1.BaseDocument {
};
exports.Property = Property;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Property.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Property.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, sparse: true }),
    __metadata("design:type", String)
], Property.prototype, "propertyCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: PropertyType, default: PropertyType.APARTMENT }),
    __metadata("design:type", String)
], Property.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: PropertyStatus, default: PropertyStatus.ACTIVE }),
    __metadata("design:type", String)
], Property.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Property.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Property.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], Property.prototype, "owner", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Property.prototype, "yearBuilt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Property.prototype, "amenities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Property.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Property.prototype, "floors", void 0);
exports.Property = Property = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Property);
exports.PropertySchema = mongoose_1.SchemaFactory.createForClass(Property);
exports.PropertySchema.index({ tenantId: 1 });
exports.PropertySchema.index({ status: 1 });
exports.PropertySchema.index({ type: 1 });
exports.PropertySchema.index({ propertyCode: 1, tenantId: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=property.schema.js.map