"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const properties_service_1 = require("./properties.service");
const properties_controller_1 = require("./properties.controller");
const property_schema_1 = require("./schemas/property.schema");
const property_repository_1 = require("./repositories/property.repository");
let PropertiesModule = class PropertiesModule {
};
exports.PropertiesModule = PropertiesModule;
exports.PropertiesModule = PropertiesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: property_schema_1.Property.name, schema: property_schema_1.PropertySchema }]),
        ],
        controllers: [properties_controller_1.PropertiesController],
        providers: [properties_service_1.PropertiesService, property_repository_1.PropertyRepository],
        exports: [properties_service_1.PropertiesService, property_repository_1.PropertyRepository],
    })
], PropertiesModule);
//# sourceMappingURL=properties.module.js.map