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
exports.DamagesService = void 0;
const common_1 = require("@nestjs/common");
const damage_repository_1 = require("./repositories/damage.repository");
let DamagesService = class DamagesService {
    constructor(damageRepository) {
        this.damageRepository = damageRepository;
    }
    async create(dto, tenantId, reportedBy) {
        return this.damageRepository.create({
            ...dto,
            tenantId,
            reportedBy,
            status: 'reported',
        });
    }
    async findAll(tenantId, page = 1, limit = 20, search, status, severity) {
        const filter = { tenantId };
        if (status)
            filter.status = status;
        if (severity)
            filter.severity = severity;
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { propertyName: { $regex: search, $options: 'i' } },
                { propertyTenantName: { $regex: search, $options: 'i' } },
            ];
        }
        return this.damageRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const damage = await this.damageRepository.findById(id);
        if (!damage || damage.isDeleted || damage.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Damage report not found');
        }
        return damage;
    }
    async findByProperty(tenantId, propertyId) {
        return this.damageRepository.findByProperty(tenantId, propertyId);
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.damageRepository.findByPropertyTenant(tenantId, propertyTenantId);
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const updateData = { ...dto };
        if (dto.status === 'assessed')
            updateData.assessedDate = new Date();
        if (dto.status === 'repaired')
            updateData.repairedDate = new Date();
        const damage = await this.damageRepository.update(id, updateData);
        if (!damage)
            throw new common_1.NotFoundException('Damage report not found');
        return damage;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
        return this.damageRepository.delete(id);
    }
    async getStats(tenantId) {
        const [total, reported, assessed, inRepair, repaired, totalCost] = await Promise.all([
            this.damageRepository.countByTenant(tenantId),
            this.damageRepository.countByStatus(tenantId, 'reported'),
            this.damageRepository.countByStatus(tenantId, 'assessed'),
            this.damageRepository.countByStatus(tenantId, 'in_repair'),
            this.damageRepository.countByStatus(tenantId, 'repaired'),
            this.damageRepository.getTotalCost(tenantId),
        ]);
        return { total, reported, assessed, inRepair, repaired, totalCost };
    }
};
exports.DamagesService = DamagesService;
exports.DamagesService = DamagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [damage_repository_1.DamageRepository])
], DamagesService);
//# sourceMappingURL=damages.service.js.map