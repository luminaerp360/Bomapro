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
exports.LeasesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lease_repository_1 = require("./repositories/lease.repository");
const units_service_1 = require("../units/units.service");
const property_tenants_service_1 = require("../property-tenants/property-tenants.service");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
const property_schema_1 = require("../properties/schemas/property.schema");
let LeasesService = class LeasesService {
    constructor(leaseRepository, unitsService, propertyTenantsService, rentSchedulesService, propertyModel) {
        this.leaseRepository = leaseRepository;
        this.unitsService = unitsService;
        this.propertyTenantsService = propertyTenantsService;
        this.rentSchedulesService = rentSchedulesService;
        this.propertyModel = propertyModel;
    }
    async create(dto, tenantId) {
        let unitDoc = null;
        if (dto.unitId) {
            const activeLease = await this.leaseRepository.findActiveByUnit(dto.unitId, tenantId);
            if (activeLease) {
                throw new common_1.BadRequestException('This unit already has an active lease');
            }
            try {
                unitDoc = await this.unitsService.findById(dto.unitId, tenantId);
            }
            catch { }
        }
        let propertyTenantDoc = null;
        if (dto.propertyTenantId) {
            try {
                propertyTenantDoc = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
                if (!propertyTenantDoc) {
                    throw new common_1.BadRequestException('Property tenant not found');
                }
                if (propertyTenantDoc.currentLeaseId) {
                    const existingActive = await this.leaseRepository.findById(propertyTenantDoc.currentLeaseId);
                    if (existingActive && !existingActive.isDeleted && existingActive.status === 'active') {
                        throw new common_1.BadRequestException('This tenant already has an active lease. Please terminate the existing lease first.');
                    }
                }
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                throw new common_1.BadRequestException('Unable to validate property tenant');
            }
        }
        let propertyName = dto.propertyName || '';
        if (!propertyName && dto.propertyId) {
            try {
                const prop = await this.propertyModel.findById(dto.propertyId).lean().exec();
                if (prop)
                    propertyName = prop.name || '';
            }
            catch { }
        }
        const propertyTenantName = dto.propertyTenantName || propertyTenantDoc?.name || '';
        const unitNumber = unitDoc?.unitNumber || '';
        const startDate = new Date(dto.startDate);
        let endDate;
        if (dto.endDate && String(dto.endDate).trim()) {
            endDate = new Date(dto.endDate);
        }
        else {
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        const leaseNumber = dto.leaseNumber || (await this.generateLeaseNumber(tenantId));
        const status = dto.status || 'active';
        const createdLease = await this.leaseRepository.create({
            ...dto,
            tenantId,
            leaseNumber,
            startDate,
            endDate,
            propertyName,
            propertyTenantName,
            unitNumber,
            status,
            scheduleGenerated: false,
        });
        if (status === 'active') {
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
        }
        if (createdLease._id && dto.rentAmount > 0) {
            try {
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
        const terminatedAt = new Date();
        const updated = await this.leaseRepository.update(id, {
            status: 'terminated',
            terminatedAt,
            terminationReason: reason || 'Terminated by management',
        });
        await this.releaseUnitAndTenantForLease(lease, tenantId);
        try {
            await this.rentSchedulesService.cancelFutureSchedulesForLease(tenantId, id, terminatedAt);
        }
        catch (error) {
            console.error('Failed to cancel future rent schedules on termination:', error.message);
        }
        return updated;
    }
    async releaseUnitAndTenantForLease(lease, tenantId) {
        const leaseId = String(lease._id);
        if (lease.propertyTenantId) {
            try {
                const pt = await this.propertyTenantsService.findById(lease.propertyTenantId, tenantId);
                if (!pt.currentLeaseId || String(pt.currentLeaseId) === leaseId) {
                    await this.propertyTenantsService.update(lease.propertyTenantId, tenantId, {
                        currentLeaseId: '',
                        currentPropertyId: '',
                    });
                }
            }
            catch (error) {
                console.error('Failed to clear PropertyTenant lease info:', error.message);
            }
        }
        if (lease.unitId) {
            try {
                const unit = await this.unitsService.findById(lease.unitId, tenantId);
                if (!unit.currentLeaseId ||
                    String(unit.currentLeaseId) === leaseId ||
                    String(unit.currentTenantId) === String(lease.propertyTenantId) ||
                    String(unit.currentPropertyTenantId) === String(lease.propertyTenantId)) {
                    await this.unitsService.releaseTenant(lease.unitId, tenantId);
                }
            }
            catch (error) {
                console.error('Failed to release unit occupancy:', error.message);
            }
        }
        else if (lease.propertyTenantId) {
            try {
                const u = await this.unitsService.findByPropertyTenant(lease.propertyTenantId, tenantId);
                if (u && (!u.currentLeaseId || String(u.currentLeaseId) === leaseId)) {
                    await this.unitsService.releaseTenant(String(u._id), tenantId);
                }
            }
            catch (error) {
                console.error('Failed to release fallback unit occupancy:', error.message);
            }
        }
    }
    async update(id, tenantId, dto) {
        const existing = await this.findById(id, tenantId);
        const updatePayload = { ...dto };
        if (dto.propertyId && !dto.propertyName) {
            try {
                const prop = await this.propertyModel.findById(dto.propertyId).lean().exec();
                if (prop)
                    updatePayload.propertyName = prop.name || '';
            }
            catch { }
        }
        if (dto.unitId) {
            try {
                const unit = await this.unitsService.findById(dto.unitId, tenantId);
                if (unit)
                    updatePayload.unitNumber = unit.unitNumber || '';
            }
            catch { }
        }
        if (dto.propertyTenantId && !dto.propertyTenantName) {
            try {
                const pt = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
                if (pt)
                    updatePayload.propertyTenantName = pt.name || '';
            }
            catch { }
        }
        if (dto.status &&
            ['terminated', 'expired'].includes(dto.status) &&
            existing.status === 'active') {
            if (dto.status === 'terminated' && !existing.terminatedAt) {
                updatePayload.terminatedAt = new Date();
            }
            await this.releaseUnitAndTenantForLease(existing, tenantId);
            await this.rentSchedulesService.cancelFutureSchedulesForLease(tenantId, id, new Date());
        }
        else if (dto.status === 'active' && existing.status !== 'active') {
            const targetUnitId = dto.unitId || existing.unitId;
            const targetTenantId = dto.propertyTenantId || existing.propertyTenantId;
            if (targetUnitId) {
                await this.unitsService.assignTenant(targetUnitId, tenantId, targetTenantId, id).catch(() => { });
            }
            if (targetTenantId) {
                await this.propertyTenantsService
                    .update(targetTenantId, tenantId, {
                    currentLeaseId: id,
                    currentPropertyId: dto.propertyId || existing.propertyId || '',
                })
                    .catch(() => { });
            }
        }
        const lease = await this.leaseRepository.update(id, updatePayload);
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
    async remove(id, tenantId) {
        const lease = await this.findById(id, tenantId);
        await this.releaseUnitAndTenantForLease(lease, tenantId);
        await this.rentSchedulesService.deleteSchedulesForLease(tenantId, id).catch(() => { });
        return this.leaseRepository.delete(id);
    }
    async signLease(id, propertyTenantId, tenantId) {
        const lease = await this.findById(id, tenantId);
        if (propertyTenantId && lease.propertyTenantId !== propertyTenantId) {
            throw new common_1.BadRequestException('You cannot sign this lease');
        }
        const updated = await this.leaseRepository.update(id, {
            isSigned: true,
            signedAt: new Date(),
            signedByPropertyTenantId: propertyTenantId || lease.propertyTenantId,
        });
        return updated;
    }
    async getStats(tenantId) {
        const [total, active, expired, draft, terminated] = await Promise.all([
            this.leaseRepository.countByTenant(tenantId),
            this.leaseRepository.countByStatus(tenantId, 'active'),
            this.leaseRepository.countByStatus(tenantId, 'expired'),
            this.leaseRepository.countByStatus(tenantId, 'draft'),
            this.leaseRepository.countByStatus(tenantId, 'terminated'),
        ]);
        const expiringSoon = await this.leaseRepository.findExpiringSoon(tenantId, 30);
        return { total, active, expired, draft, terminated, expiringSoonCount: expiringSoon.length };
    }
    async generateLeaseNumber(tenantId) {
        try {
            const leases = await this.leaseRepository.findByTenant(tenantId);
            let maxNumber = 0;
            for (const l of leases || []) {
                const match = l.leaseNumber?.match(/LS-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
            return `LS-${String(maxNumber + 1).padStart(4, '0')}`;
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
    __param(4, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [lease_repository_1.LeaseRepository,
        units_service_1.UnitsService,
        property_tenants_service_1.PropertyTenantsService,
        rent_schedules_service_1.RentSchedulesService,
        mongoose_2.Model])
], LeasesService);
//# sourceMappingURL=leases.service.js.map