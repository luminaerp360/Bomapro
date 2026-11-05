"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const units_service_1 = require("./units.service");
const units_controller_1 = require("./units.controller");
const unit_schema_1 = require("./schemas/unit.schema");
const unit_repository_1 = require("./repositories/unit.repository");
<<<<<<< HEAD
const properties_module_1 = require("../properties/properties.module");
=======
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
let UnitsModule = class UnitsModule {
};
exports.UnitsModule = UnitsModule;
exports.UnitsModule = UnitsModule = __decorate([
    (0, common_1.Module)({
<<<<<<< HEAD
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: unit_schema_1.Unit.name, schema: unit_schema_1.UnitSchema }]),
            (0, common_1.forwardRef)(() => properties_module_1.PropertiesModule),
        ],
=======
        imports: [mongoose_1.MongooseModule.forFeature([{ name: unit_schema_1.Unit.name, schema: unit_schema_1.UnitSchema }])],
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
        controllers: [units_controller_1.UnitsController],
        providers: [units_service_1.UnitsService, unit_repository_1.UnitRepository],
        exports: [units_service_1.UnitsService, unit_repository_1.UnitRepository],
    })
], UnitsModule);
//# sourceMappingURL=units.module.js.map