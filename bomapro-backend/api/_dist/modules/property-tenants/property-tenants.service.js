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
var PropertyTenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyTenantsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const property_tenant_repository_1 = require("./repositories/property-tenant.repository");
const tenant_portal_service_1 = require("../tenant-portal/tenant-portal.service");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
let PropertyTenantsService = PropertyTenantsService_1 = class PropertyTenantsService {
    constructor(propertyTenantRepository, leaseModel, unitModel, propertyModel, rentSchedulesService, tenantPortalService) {
        this.propertyTenantRepository = propertyTenantRepository;
        this.leaseModel = leaseModel;
        this.unitModel = unitModel;
        this.propertyModel = propertyModel;
        this.rentSchedulesService = rentSchedulesService;
        this.tenantPortalService = tenantPortalService;
        this.logger = new common_1.Logger(PropertyTenantsService_1.name);
    }
    async generateNextLeaseNumber() {
        const existing = await this.leaseModel
            .find({ leaseNumber: { $regex: /^LS-\d+$/ } })
            .select('leaseNumber')
            .lean()
            .exec();
        let maxNum = 0;
        for (const l of existing) {
            const m = /^LS-(\d+)$/.exec(l.leaseNumber || '');
            if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum)
                    maxNum = n;
            }
        }
        return `LS-${String(maxNum + 1).padStart(4, '0')}`;
    }
    async assignUnitAndCreateLeaseForTenant(tenant, dto, tenantId) {
        if (!dto.unitId)
            return null;
        const unit = await this.unitModel.findById(dto.unitId).exec();
        if (!unit)
            return null;
        const propertyId = dto.propertyId || unit.propertyId;
        const property = propertyId ? await this.propertyModel.findById(propertyId).lean().exec() : null;
        const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
        const durationMonths = Math.max(12, Number(dto.leaseDurationMonths) || 12);
        let endDate;
        if (dto.endDate) {
            endDate = new Date(dto.endDate);
            if (isNaN(endDate.getTime()) || endDate <= startDate) {
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + durationMonths);
            }
        }
        else {
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + durationMonths);
        }
        const rentAmount = dto.rentAmount !== undefined && dto.rentAmount !== null
            ? Number(dto.rentAmount)
            : unit.rentAmount;
        const depositAmount = dto.depositAmount !== undefined && dto.depositAmount !== null
            ? Number(dto.depositAmount)
            : (unit.securityDeposit || rentAmount || 0);
        const paymentDueDay = dto.paymentDueDay || 5;
        const leaseNumber = await this.generateNextLeaseNumber();
        const lease = await this.leaseModel.create({
            tenantId,
            propertyTenantId: String(tenant._id),
            unitId: String(unit._id),
            unitNumber: unit.unitNumber || '',
            propertyId: String(propertyId),
            propertyName: property?.name || '',
            propertyTenantName: tenant.name || '',
            leaseNumber,
            status: 'active',
            startDate,
            endDate,
            rentAmount,
            depositAmount,
            currency: unit.currency || 'KES',
            paymentFrequency: 'monthly',
            paymentDueDay,
            gracePeriodDays: 5,
        });
        try {
            await this.rentSchedulesService.generateSchedulesForLease(String(lease._id), tenantId, String(propertyId), String(unit._id), startDate, rentAmount, 5, durationMonths);
            await this.leaseModel.findByIdAndUpdate(lease._id, {
                scheduleGenerated: true,
                scheduleGeneratedAt: new Date(),
            });
        }
        catch (scheduleErr) {
            this.logger.error(`Failed to generate rent schedules for lease ${lease._id}`, scheduleErr);
        }
        await this.unitModel.findByIdAndUpdate(unit._id, {
            currentTenantId: String(tenant._id),
            currentPropertyTenantId: String(tenant._id),
            currentLeaseId: String(lease._id),
            status: 'occupied',
        });
        await this.propertyTenantRepository.update(String(tenant._id), {
            currentPropertyId: String(propertyId),
            currentLeaseId: String(lease._id),
        });
        return lease;
    }
    async create(dto, tenantId) {
        const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : '';
        if (cleanEmail) {
            const existing = await this.propertyTenantRepository.findByEmail(tenantId, cleanEmail);
            if (existing) {
                throw new common_1.ConflictException('A tenant with this email already exists');
            }
        }
        const payload = {
            ...dto,
            tenantId,
            email: cleanEmail,
        };
        const tenant = await this.propertyTenantRepository.create(payload);
        if (dto.unitId) {
            try {
                await this.assignUnitAndCreateLeaseForTenant(tenant, dto, tenantId);
            }
            catch (err) {
                this.logger.error(`Failed to automatically assign unit ${dto.unitId} to tenant ${tenant._id}`, err);
            }
        }
        if (cleanEmail) {
            try {
                const { token } = await this.tenantPortalService.generateAndSaveInviteToken(tenant);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
                const link = `${frontendUrl}/tenant-portal/setup-password?token=${token}`;
                await this.tenantPortalService.sendPortalInviteEmail(tenant.email, tenant.name, link);
            }
            catch (err) {
                this.logger.error(`Failed to send portal invite to ${cleanEmail}`, err);
            }
        }
        return this.enrichTenant(await this.propertyTenantRepository.findById(String(tenant._id)));
    }
    async enrichTenant(tenant) {
        if (!tenant)
            return null;
        const enriched = tenant?.toObject ? tenant.toObject() : { ...tenant };
        if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
            try {
                const lease = await this.leaseModel.findById(enriched.currentLeaseId).exec();
                if (lease && !lease.isDeleted && lease.status === 'active') {
                    enriched.leaseNumber = lease.leaseNumber;
                    enriched.leaseStatus = lease.status;
                    enriched.leaseStartDate = lease.startDate;
                    enriched.leaseEndDate = lease.endDate;
                    if (lease.rentAmount !== undefined && !enriched.rentAmount)
                        enriched.rentAmount = lease.rentAmount;
                    if (lease.currency && !enriched.currency)
                        enriched.currency = lease.currency;
                    if (lease.unitNumber)
                        enriched.unitNumber = lease.unitNumber;
                    if (lease.unitId) {
                        enriched.unitId = String(lease.unitId);
                        if (!enriched.unitNumber) {
                            const unit = await this.unitModel.findById(lease.unitId).exec();
                            if (unit) {
                                enriched.unitNumber = unit.unitNumber;
                                if (!enriched.rentAmount && unit.rentAmount)
                                    enriched.rentAmount = unit.rentAmount;
                                if (!enriched.currency && unit.currency)
                                    enriched.currency = unit.currency;
                            }
                        }
                    }
                }
            }
            catch (err) {
            }
        }
        if (!enriched.unitNumber) {
            try {
                const directUnit = await this.unitModel.findOne({
                    $or: [
                        { currentTenantId: String(enriched._id) },
                        { currentPropertyTenantId: String(enriched._id) },
                    ],
                    isDeleted: false,
                }).exec();
                if (directUnit) {
                    enriched.unitNumber = directUnit.unitNumber;
                    enriched.unitId = String(directUnit._id);
                    if (!enriched.rentAmount && directUnit.rentAmount)
                        enriched.rentAmount = directUnit.rentAmount;
                    if (!enriched.currency && directUnit.currency)
                        enriched.currency = directUnit.currency;
                    if (!enriched.currentPropertyId && directUnit.propertyId) {
                        enriched.currentPropertyId = directUnit.propertyId;
                    }
                }
            }
            catch (err) {
            }
        }
        if (enriched.currentPropertyId && String(enriched.currentPropertyId).trim()) {
            try {
                const property = await this.propertyModel.findById(enriched.currentPropertyId).exec();
                if (property) {
                    enriched.propertyName = property.name;
                }
            }
            catch (err) {
            }
        }
        return enriched;
    }
    async findAll(tenantId, page = 1, limit = 20, search, propertyId) {
        const filter = { tenantId };
        if (propertyId) {
            filter.currentPropertyId = propertyId;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { idNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const result = await this.propertyTenantRepository.findPaginated({ page, limit, filter });
        if (!result.data.length) {
            return result;
        }
        const plainTenants = result.data.map((t) => (t?.toObject ? t.toObject() : { ...t }));
        const tenantIds = plainTenants.map((t) => String(t._id));
        const leaseIds = plainTenants
            .map((t) => t.currentLeaseId && String(t.currentLeaseId).trim())
            .filter(Boolean);
        const [leases, directUnits] = await Promise.all([
            leaseIds.length
                ? this.leaseModel.find({ _id: { $in: leaseIds }, isDeleted: false }).lean().exec()
                : Promise.resolve([]),
            this.unitModel
                .find({
                $or: [
                    { currentTenantId: { $in: tenantIds } },
                    { currentPropertyTenantId: { $in: tenantIds } },
                ],
                isDeleted: false,
            })
                .lean()
                .exec(),
        ]);
        const leaseMap = new Map(leases.map((l) => [String(l._id), l]));
        const directUnitByTenantMap = new Map();
        for (const u of directUnits) {
            if (u.currentTenantId)
                directUnitByTenantMap.set(String(u.currentTenantId), u);
            if (u.currentPropertyTenantId)
                directUnitByTenantMap.set(String(u.currentPropertyTenantId), u);
        }
        const leaseUnitIds = leases.map((l) => l.unitId && String(l.unitId).trim()).filter(Boolean);
        const leaseUnits = leaseUnitIds.length
            ? await this.unitModel.find({ _id: { $in: leaseUnitIds } }).lean().exec()
            : [];
        const unitByIdMap = new Map(leaseUnits.map((u) => [String(u._id), u]));
        const propertyIds = new Set();
        for (const t of plainTenants) {
            if (t.currentPropertyId && String(t.currentPropertyId).trim()) {
                propertyIds.add(String(t.currentPropertyId).trim());
            }
            const dUnit = directUnitByTenantMap.get(String(t._id));
            if (dUnit?.propertyId)
                propertyIds.add(String(dUnit.propertyId));
        }
        const properties = propertyIds.size
            ? await this.propertyModel.find({ _id: { $in: Array.from(propertyIds) } }).lean().exec()
            : [];
        const propertyMap = new Map(properties.map((p) => [String(p._id), p]));
        const enrichedData = plainTenants.map((enriched) => {
            if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
                const lease = leaseMap.get(String(enriched.currentLeaseId).trim());
                if (lease && lease.status === 'active') {
                    enriched.leaseNumber = lease.leaseNumber;
                    enriched.leaseStatus = lease.status;
                    enriched.leaseStartDate = lease.startDate;
                    enriched.leaseEndDate = lease.endDate;
                    if (lease.rentAmount !== undefined && !enriched.rentAmount)
                        enriched.rentAmount = lease.rentAmount;
                    if (lease.currency && !enriched.currency)
                        enriched.currency = lease.currency;
                    if (lease.unitNumber)
                        enriched.unitNumber = lease.unitNumber;
                    if (lease.unitId) {
                        enriched.unitId = String(lease.unitId);
                        const unit = unitByIdMap.get(String(lease.unitId));
                        if (unit) {
                            enriched.unitNumber = unit.unitNumber;
                            if (!enriched.rentAmount && unit.rentAmount)
                                enriched.rentAmount = unit.rentAmount;
                            if (!enriched.currency && unit.currency)
                                enriched.currency = unit.currency;
                        }
                    }
                }
            }
            if (!enriched.unitNumber) {
                const directUnit = directUnitByTenantMap.get(String(enriched._id));
                if (directUnit && directUnit.status === 'occupied') {
                    enriched.unitNumber = directUnit.unitNumber;
                    enriched.unitId = String(directUnit._id);
                    if (!enriched.rentAmount && directUnit.rentAmount)
                        enriched.rentAmount = directUnit.rentAmount;
                    if (!enriched.currency && directUnit.currency)
                        enriched.currency = directUnit.currency;
                    if (!enriched.currentPropertyId && directUnit.propertyId) {
                        enriched.currentPropertyId = directUnit.propertyId;
                    }
                }
            }
            if (enriched.currentPropertyId && String(enriched.currentPropertyId).trim()) {
                const property = propertyMap.get(String(enriched.currentPropertyId).trim());
                if (property) {
                    enriched.propertyName = property.name;
                }
            }
            return enriched;
        });
        return {
            ...result,
            data: enrichedData,
        };
    }
    async findById(id, tenantId) {
        const tenant = await this.propertyTenantRepository.findById(id);
        if (!tenant || tenant.isDeleted || tenant.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return this.enrichTenant(tenant);
    }
    async findByProperty(tenantId, propertyId) {
        return this.propertyTenantRepository.findByProperty(tenantId, propertyId);
    }
    async update(id, tenantId, dto) {
        const existing = await this.findById(id, tenantId);
        const tenant = await this.propertyTenantRepository.update(id, dto);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        if (dto.unitId && (!existing.currentLeaseId || existing.unitId !== dto.unitId)) {
            try {
                await this.assignUnitAndCreateLeaseForTenant(tenant, dto, tenantId);
            }
            catch (err) {
                this.logger.error(`Failed to assign unit ${dto.unitId} during tenant update`, err);
            }
        }
        return this.enrichTenant(await this.propertyTenantRepository.findById(id));
    }
    async remove(id, tenantId) {
        const tenant = await this.findById(id, tenantId);
        try {
            const activeLeases = await this.leaseModel
                .find({ propertyTenantId: String(id), status: { $in: ['active', 'draft'] }, isDeleted: false })
                .exec();
            for (const lease of activeLeases) {
                await this.leaseModel.findByIdAndUpdate(lease._id, {
                    status: 'terminated',
                    terminatedAt: new Date(),
                    terminationReason: 'Tenant record deleted',
                });
                await this.rentSchedulesService.cancelFutureSchedulesForLease(tenantId, String(lease._id), new Date());
                if (lease.unitId) {
                    await this.unitModel.findByIdAndUpdate(lease.unitId, {
                        currentTenantId: '',
                        currentPropertyTenantId: '',
                        currentLeaseId: '',
                        status: 'vacant',
                    });
                }
            }
            await this.unitModel.updateMany({
                $or: [{ currentTenantId: String(id) }, { currentPropertyTenantId: String(id) }],
            }, {
                $set: {
                    currentTenantId: '',
                    currentPropertyTenantId: '',
                    currentLeaseId: '',
                    status: 'vacant',
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to clean up leases/units when deleting tenant ${id}`, err);
        }
        return this.propertyTenantRepository.delete(id);
    }
    async getStats(tenantId) {
        const [total, active] = await Promise.all([
            this.propertyTenantRepository.countBySystemTenant(tenantId),
            this.propertyTenantRepository.countActive(tenantId),
        ]);
        return { total, active, inactive: total - active };
    }
};
exports.PropertyTenantsService = PropertyTenantsService;
exports.PropertyTenantsService = PropertyTenantsService = PropertyTenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(lease_schema_1.Lease.name)),
    __param(2, (0, mongoose_1.InjectModel)(unit_schema_1.Unit.name)),
    __param(3, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => tenant_portal_service_1.TenantPortalService))),
    __metadata("design:paramtypes", [property_tenant_repository_1.PropertyTenantRepository,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        rent_schedules_service_1.RentSchedulesService,
        tenant_portal_service_1.TenantPortalService])
], PropertyTenantsService);
//# sourceMappingURL=property-tenants.service.js.map