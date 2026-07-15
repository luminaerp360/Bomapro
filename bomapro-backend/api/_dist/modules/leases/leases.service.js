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
exports.LeasesService = void 0;
const common_1 = require("@nestjs/common");
const lease_repository_1 = require("./repositories/lease.repository");
const units_service_1 = require("../units/units.service");
const property_tenants_service_1 = require("../property-tenants/property-tenants.service");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
let LeasesService = class LeasesService {
    constructor(leaseRepository, unitsService, propertyTenantsService, rentSchedulesService) {
        this.leaseRepository = leaseRepository;
        this.unitsService = unitsService;
        this.propertyTenantsService = propertyTenantsService;
        this.rentSchedulesService = rentSchedulesService;
    }
    async create(dto, tenantId) {
        if (dto.unitId) {
            const activeLease = await this.leaseRepository.findActiveByUnit(dto.unitId, tenantId);
            if (activeLease) {
                throw new common_1.BadRequestException('This unit already has an active lease');
            }
        }
        if (dto.propertyTenantId) {
            try {
                const propertyTenant = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
                if (!propertyTenant) {
                    throw new common_1.BadRequestException('Property tenant not found');
                }
                if (propertyTenant.currentLeaseId) {
                    throw new common_1.BadRequestException('This tenant already has an active lease. Please terminate the existing lease first.');
                }
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                throw new common_1.BadRequestException('Unable to validate property tenant');
            }
        }
        const leaseNumber = await this.generateLeaseNumber(tenantId);
        const createdLease = await this.leaseRepository.create({
            ...dto,
            tenantId,
            leaseNumber,
            status: 'active',
            scheduleGenerated: false,
        });
        if (dto.propertyTenantId && createdLease._id) {
            try {
                await this.propertyTenantsService.update(dto.propertyTenantId, tenantId, {
                    currentLeaseId: createdLease._id.toString(),
                    currentPropertyId: dto.propertyId || '',
                });
            }
            catch (error) {
                console.error('Failed to update PropertyTenant lease info:', error.message);
            }
        }
        if (dto.unitId && createdLease._id) {
            try {
                await this.unitsService.assignTenant(dto.unitId, tenantId, dto.propertyTenantId, createdLease._id.toString());
            }
            catch (error) {
                console.error('Failed to update unit occupancy during lease creation:', error.message);
            }
        }
        if (createdLease._id && dto.rentAmount > 0) {
            try {
                const startDate = new Date(dto.startDate);
                await this.rentSchedulesService.generateSchedulesForLease(createdLease._id.toString(), tenantId, dto.propertyId, dto.unitId, startDate, dto.rentAmount, dto.gracePeriodDays || 5, 12);
                await this.leaseRepository.update(createdLease._id.toString(), {
                    scheduleGenerated: true,
                    scheduleGeneratedAt: new Date(),
                });
            }
            catch (error) {
                console.error('Failed to generate rent schedule:', error.message);
            }
        }
        return createdLease;
    }
    async findAll(tenantId, page = 1, limit = 20, search, status) {
        const filter = { tenantId };
        if (status)
            filter.status = status;
        if (search) {
            filter.$or = [
                { leaseNumber: { $regex: search, $options: 'i' } },
                { propertyName: { $regex: search, $options: 'i' } },
                { propertyTenantName: { $regex: search, $options: 'i' } },
            ];
        }
        return this.leaseRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const lease = await this.leaseRepository.findById(id);
        if (!lease || lease.isDeleted || lease.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Lease not found');
        }
        return lease;
    }
    async findWithBalance(id, tenantId) {
        const lease = await this.findById(id, tenantId);
        const balance = await this.rentSchedulesService.getLeaseBalance(tenantId, id);
        const schedules = await this.rentSchedulesService.findByLease(tenantId, id);
        return {
            lease,
            balance,
            schedules,
        };
    }
    async findByProperty(tenantId, propertyId) {
        return this.leaseRepository.findByProperty(tenantId, propertyId);
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.leaseRepository.findByPropertyTenant(tenantId, propertyTenantId);
    }
    async findExpiringSoon(tenantId, days = 30) {
        return this.leaseRepository.findExpiringSoon(tenantId, days);
    }
    async findByUnit(tenantId, unitId) {
        return this.leaseRepository.findByUnit(tenantId, unitId);
    }
    async activate(id, tenantId) {
        const lease = await this.findById(id, tenantId);
        if (lease.unitId) {
            const activeLease = await this.leaseRepository.findActiveByUnit(lease.unitId, tenantId);
            if (activeLease && activeLease._id.toString() !== id) {
                throw new common_1.BadRequestException('This unit already has an active lease');
            }
        }
        const updated = await this.leaseRepository.update(id, { status: 'active' });
        if (lease.unitId) {
            try {
                await this.unitsService.assignTenant(lease.unitId, tenantId, lease.propertyTenantId, id);
            }
            catch (error) {
                console.error('Failed to update unit occupancy:', error.message);
            }
        }
        return updated;
    }
    async terminate(id, tenantId, reason) {
        const lease = await this.findById(id, tenantId);
        const updated = await this.leaseRepository.update(id, {
            status: 'terminated',
            terminatedAt: new Date(),
            terminationReason: reason,
        });
        if (lease.propertyTenantId) {
            try {
                await this.propertyTenantsService.update(lease.propertyTenantId, tenantId, {
                    currentLeaseId: '',
                    currentPropertyId: '',
                });
            }
            catch (error) {
                console.error('Failed to clear PropertyTenant lease info:', error.message);
            }
        }
        if (lease.unitId) {
            try {
                await this.unitsService.releaseTenant(lease.unitId, tenantId);
            }
            catch (error) {
                console.error('Failed to release unit occupancy:', error.message);
            }
        }
        return updated;
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const lease = await this.leaseRepository.update(id, dto);
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
        return this.leaseRepository.delete(id);
    }
    async signLease(id, propertyTenantId, tenantId) {
        const lease = await this.findById(id, tenantId);
        if (lease.propertyTenantId !== propertyTenantId) {
            throw new common_1.BadRequestException('You cannot sign this lease');
        }
        const updated = await this.leaseRepository.update(id, {
            isSigned: true,
            signedAt: new Date(),
            signedByPropertyTenantId: propertyTenantId,
        });
        return updated;
    }
    async getStats(tenantId) {
        const [total, active, expired, draft] = await Promise.all([
            this.leaseRepository.countByTenant(tenantId),
            this.leaseRepository.countByStatus(tenantId, 'active'),
            this.leaseRepository.countByStatus(tenantId, 'expired'),
            this.leaseRepository.countByStatus(tenantId, 'draft'),
        ]);
        const expiringSoon = await this.leaseRepository.findExpiringSoon(tenantId, 30);
        return { total, active, expired, draft, expiringSoonCount: expiringSoon.length };
    }
    async generateLeaseNumber(tenantId) {
        try {
            const leases = await this.leaseRepository.findByTenant(tenantId);
            let nextNumber = 1;
            if (leases && leases.length > 0) {
                const lastLease = leases[0];
                const match = lastLease.leaseNumber?.match(/LS-(\d+)/);
                if (match && match[1]) {
                    const lastNumber = parseInt(match[1], 10);
                    nextNumber = lastNumber + 1;
                }
            }
            return `LS-${String(nextNumber).padStart(4, '0')}`;
        }
        catch (error) {
            console.error('Error generating lease number:', error.message);
            return `LS-0001`;
        }
    }
};
exports.LeasesService = LeasesService;
exports.LeasesService = LeasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lease_repository_1.LeaseRepository,
        units_service_1.UnitsService,
        property_tenants_service_1.PropertyTenantsService,
        rent_schedules_service_1.RentSchedulesService])
], LeasesService);
//# sourceMappingURL=leases.service.js.map