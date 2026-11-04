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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const unit_repository_1 = require("./repositories/unit.repository");
let UnitsService = class UnitsService {
    constructor(unitRepository) {
        this.unitRepository = unitRepository;
    }
    async create(dto, tenantId) {
        return this.unitRepository.create({
            ...dto,
            tenantId,
            currentTenantId: '',
            currentLeaseId: '',
            currentPropertyTenantId: '',
        });
    }
    async findAll(tenantId, page = 1, limit = 20, propertyId, status, search, unitType, floor) {
        const filter = { tenantId };
        if (propertyId)
            filter.propertyId = propertyId;
        if (status)
            filter.status = status;
        if (unitType)
            filter.unitType = unitType;
        if (floor !== undefined && floor !== null && floor !== '') {
            if (floor === 'G' || floor === '0') {
                filter.floor = { $in: ['G', 0, '0', 'g'] };
            }
            else {
                const floorNum = parseInt(floor, 10);
                if (!isNaN(floorNum)) {
                    filter.floor = { $in: [floor, floorNum, String(floorNum)] };
                }
                else {
                    filter.floor = floor;
                }
            }
        }
        if (search) {
            filter.$or = [
                { unitNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        return this.unitRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const unit = await this.unitRepository.findById(id);
        if (!unit || unit.isDeleted || unit.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Unit not found');
        }
        return unit;
    }
    async findByProperty(propertyId, tenantId) {
        return this.unitRepository.findByProperty(propertyId, tenantId);
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const unit = await this.unitRepository.update(id, dto);
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        return unit;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
        return this.unitRepository.delete(id);
    }
    async getStats(tenantId) {
        const [total, occupied, available] = await Promise.all([
            this.unitRepository.countByTenant(tenantId),
            this.unitRepository.countOccupied(tenantId),
            this.unitRepository.countAvailable(tenantId),
        ]);
        return { total, occupied, available };
    }
    async assignTenant(unitId, tenantId, propertyTenantId, leaseId) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, {
            currentTenantId: propertyTenantId,
            currentLeaseId: leaseId,
            currentPropertyTenantId: propertyTenantId,
            status: 'occupied',
        });
    }
    async releaseTenant(unitId, tenantId) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, {
            currentTenantId: '',
            currentLeaseId: '',
            currentPropertyTenantId: '',
            status: 'vacant',
        });
    }
    async updateStatus(unitId, tenantId, status) {
        const unit = await this.findById(unitId, tenantId);
        return this.unitRepository.update(unitId, { status });
    }
    async findByPropertyTenant(propertyTenantId, tenantId) {
        return this.unitRepository.findByPropertyTenant(propertyTenantId, tenantId);
    }
    async findAvailableByProperty(propertyId, tenantId) {
        return this.unitRepository.findAvailable(propertyId, tenantId);
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [unit_repository_1.UnitRepository])
], UnitsService);
//# sourceMappingURL=units.service.js.map