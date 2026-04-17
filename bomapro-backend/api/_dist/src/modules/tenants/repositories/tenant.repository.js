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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const tenant_schema_1 = require("../schemas/tenant.schema");
let TenantRepository = class TenantRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findBySlug(slug) {
        return this.model.findOne({ slug, isDeleted: false }).exec();
    }
    async findByOwner(ownerUserId) {
        return this.model.find({ ownerUserId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    }
    async findByIds(ids) {
        return this.model.find({ _id: { $in: ids }, isDeleted: false, isActive: true }).exec();
    }
};
exports.TenantRepository = TenantRepository;
exports.TenantRepository = TenantRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TenantRepository);
//# sourceMappingURL=tenant.repository.js.map