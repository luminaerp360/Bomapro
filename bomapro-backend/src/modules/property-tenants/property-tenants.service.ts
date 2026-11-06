import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyTenantRepository } from './repositories/property-tenant.repository';
import { CreatePropertyTenantDto, UpdatePropertyTenantDto } from './dto/property-tenant.dto';
import { TenantPortalService } from '../tenant-portal/tenant-portal.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { Lease } from '../leases/schemas/lease.schema';
import { Unit } from '../units/schemas/unit.schema';
import { Property } from '../properties/schemas/property.schema';

@Injectable()
export class PropertyTenantsService {
  private readonly logger = new Logger(PropertyTenantsService.name);

  constructor(
    private readonly propertyTenantRepository: PropertyTenantRepository,
    @InjectModel(Lease.name) private leaseModel: Model<Lease>,
    @InjectModel(Unit.name) private unitModel: Model<Unit>,
    @InjectModel(Property.name) private propertyModel: Model<Property>,
    private readonly rentSchedulesService: RentSchedulesService,
    @Inject(forwardRef(() => TenantPortalService)) private readonly tenantPortalService: TenantPortalService,
  ) {}

  private async generateNextLeaseNumber(): Promise<string> {
    const existing = await this.leaseModel
      .find({ leaseNumber: { $regex: /^LS-\d+$/ } })
      .select('leaseNumber')
      .lean()
      .exec();
    let maxNum = 0;
    for (const l of existing) {
      const m = /^LS-(\d+)$/.exec((l as any).leaseNumber || '');
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return `LS-${String(maxNum + 1).padStart(4, '0')}`;
  }

  /**
   * Assigns a vacant unit to a tenant, automatically creates an active Lease
   * (minimum 1 year / 12 months by default), generates monthly RentSchedules,
   * and links the Unit, Lease, and PropertyTenant records together.
   */
  private async assignUnitAndCreateLeaseForTenant(
    tenant: any,
    dto: CreatePropertyTenantDto | UpdatePropertyTenantDto,
    tenantId: string,
  ): Promise<any> {
    if (!dto.unitId) return null;

    const unit = await this.unitModel.findById(dto.unitId).exec();
    if (!unit) return null;

    const propertyId = dto.propertyId || unit.propertyId;
    const property = propertyId ? await this.propertyModel.findById(propertyId).lean().exec() : null;

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const durationMonths = Math.max(12, Number(dto.leaseDurationMonths) || 12);

    let endDate: Date;
    if (dto.endDate) {
      endDate = new Date(dto.endDate);
      // Enforce at least 1 year from startDate if endDate is invalid or before startDate
      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);
      }
    } else {
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
      propertyName: (property as any)?.name || '',
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

    // Generate monthly rent schedules for the lease duration (at least 12 months)
    try {
      await this.rentSchedulesService.generateSchedulesForLease(
        String(lease._id),
        tenantId,
        String(propertyId),
        String(unit._id),
        startDate,
        rentAmount,
        5,
        durationMonths,
      );
      await this.leaseModel.findByIdAndUpdate(lease._id, {
        scheduleGenerated: true,
        scheduleGeneratedAt: new Date(),
      });
    } catch (scheduleErr) {
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
    } as any);

    return lease;
  }

  async create(dto: CreatePropertyTenantDto, tenantId: string) {
    const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : '';
    if (cleanEmail) {
      const existing = await this.propertyTenantRepository.findByEmail(tenantId, cleanEmail);
      if (existing) {
        throw new ConflictException('A tenant with this email already exists');
      }
    }

    const payload: any = {
      ...dto,
      tenantId,
      email: cleanEmail,
    };

    const tenant = await this.propertyTenantRepository.create(payload);

    // If unitId is provided, assign unit, create active 1+ year lease, and generate rent schedules
    if (dto.unitId) {
      try {
        await this.assignUnitAndCreateLeaseForTenant(tenant, dto, tenantId);
      } catch (err) {
        this.logger.error(`Failed to automatically assign unit ${dto.unitId} to tenant ${tenant._id}`, err);
      }
    }

    // Send tenant portal invite email if email is provided
    if (cleanEmail) {
      try {
        const { token } = await this.tenantPortalService.generateAndSaveInviteToken(tenant);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const link = `${frontendUrl}/tenant-portal/setup-password?token=${token}`;
        await this.tenantPortalService.sendPortalInviteEmail(tenant.email, tenant.name, link);
      } catch (err) {
        this.logger.error(`Failed to send portal invite to ${cleanEmail}`, err);
      }
    }

    return this.enrichTenant(await this.propertyTenantRepository.findById(String(tenant._id)));
  }

  private async enrichTenant(tenant: any): Promise<any> {
    if (!tenant) return null;
    const enriched = tenant?.toObject ? tenant.toObject() : { ...tenant };

    // Fetch unit and property information if tenant has a current lease
    if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
      try {
        const lease = await this.leaseModel.findById(enriched.currentLeaseId).exec();
        if (lease && !lease.isDeleted && lease.status === 'active') {
          enriched.leaseNumber = lease.leaseNumber;
          enriched.leaseStatus = lease.status;
          enriched.leaseStartDate = lease.startDate;
          enriched.leaseEndDate = lease.endDate;
          if (lease.rentAmount !== undefined && !enriched.rentAmount) enriched.rentAmount = lease.rentAmount;
          if (lease.currency && !enriched.currency) enriched.currency = lease.currency;
          if (lease.unitNumber) enriched.unitNumber = lease.unitNumber;
          if (lease.unitId) {
            enriched.unitId = String(lease.unitId);
            if (!enriched.unitNumber) {
              const unit = await this.unitModel.findById(lease.unitId).exec();
              if (unit) {
                enriched.unitNumber = unit.unitNumber;
                if (!enriched.rentAmount && unit.rentAmount) enriched.rentAmount = unit.rentAmount;
                if (!enriched.currency && unit.currency) enriched.currency = unit.currency;
              }
            }
          }
        }
      } catch (err) {
        // Silently fail enrichment
      }
    }

    // If unitNumber not resolved via lease, check direct unit assignment
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
          if (!enriched.rentAmount && directUnit.rentAmount) enriched.rentAmount = directUnit.rentAmount;
          if (!enriched.currency && directUnit.currency) enriched.currency = directUnit.currency;
          if (!enriched.currentPropertyId && directUnit.propertyId) {
            enriched.currentPropertyId = directUnit.propertyId;
          }
        }
      } catch (err) {
        // Silently fail enrichment
      }
    }

    // Fetch property information
    if (enriched.currentPropertyId && String(enriched.currentPropertyId).trim()) {
      try {
        const property = await this.propertyModel.findById(enriched.currentPropertyId).exec();
        if (property) {
          enriched.propertyName = property.name;
        }
      } catch (err) {
        // Silently fail enrichment
      }
    }

    return enriched;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, propertyId?: string) {
    const filter: any = { tenantId };
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

    // Batch-enrich all tenants in parallel
    const plainTenants = result.data.map((t: any) => (t?.toObject ? t.toObject() : { ...t }));
    const tenantIds = plainTenants.map((t: any) => String(t._id));
    const leaseIds = plainTenants
      .map((t: any) => t.currentLeaseId && String(t.currentLeaseId).trim())
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

    const leaseMap = new Map<string, any>(leases.map((l: any) => [String(l._id), l]));
    const directUnitByTenantMap = new Map<string, any>();
    for (const u of directUnits as any[]) {
      if (u.currentTenantId) directUnitByTenantMap.set(String(u.currentTenantId), u);
      if (u.currentPropertyTenantId) directUnitByTenantMap.set(String(u.currentPropertyTenantId), u);
    }

    const leaseUnitIds = leases.map((l: any) => l.unitId && String(l.unitId).trim()).filter(Boolean);
    const leaseUnits = leaseUnitIds.length
      ? await this.unitModel.find({ _id: { $in: leaseUnitIds } }).lean().exec()
      : [];
    const unitByIdMap = new Map<string, any>(leaseUnits.map((u: any) => [String(u._id), u]));

    const propertyIds = new Set<string>();
    for (const t of plainTenants) {
      if (t.currentPropertyId && String(t.currentPropertyId).trim()) {
        propertyIds.add(String(t.currentPropertyId).trim());
      }
      const dUnit = directUnitByTenantMap.get(String(t._id));
      if (dUnit?.propertyId) propertyIds.add(String(dUnit.propertyId));
    }

    const properties = propertyIds.size
      ? await this.propertyModel.find({ _id: { $in: Array.from(propertyIds) } }).lean().exec()
      : [];
    const propertyMap = new Map<string, any>(properties.map((p: any) => [String(p._id), p]));

    const enrichedData = plainTenants.map((enriched: any) => {
      if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
        const lease = leaseMap.get(String(enriched.currentLeaseId).trim());
        if (lease && lease.status === 'active') {
          enriched.leaseNumber = lease.leaseNumber;
          enriched.leaseStatus = lease.status;
          enriched.leaseStartDate = lease.startDate;
          enriched.leaseEndDate = lease.endDate;
          if (lease.rentAmount !== undefined && !enriched.rentAmount) enriched.rentAmount = lease.rentAmount;
          if (lease.currency && !enriched.currency) enriched.currency = lease.currency;
          if (lease.unitNumber) enriched.unitNumber = lease.unitNumber;
          if (lease.unitId) {
            enriched.unitId = String(lease.unitId);
            const unit = unitByIdMap.get(String(lease.unitId));
            if (unit) {
              enriched.unitNumber = unit.unitNumber;
              if (!enriched.rentAmount && unit.rentAmount) enriched.rentAmount = unit.rentAmount;
              if (!enriched.currency && unit.currency) enriched.currency = unit.currency;
            }
          }
        }
      }

      if (!enriched.unitNumber) {
        const directUnit = directUnitByTenantMap.get(String(enriched._id));
        if (directUnit && directUnit.status === 'occupied') {
          enriched.unitNumber = directUnit.unitNumber;
          enriched.unitId = String(directUnit._id);
          if (!enriched.rentAmount && directUnit.rentAmount) enriched.rentAmount = directUnit.rentAmount;
          if (!enriched.currency && directUnit.currency) enriched.currency = directUnit.currency;
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

  async findById(id: string, tenantId: string) {
    const tenant = await this.propertyTenantRepository.findById(id);
    if (!tenant || tenant.isDeleted || tenant.tenantId !== tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.enrichTenant(tenant);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.propertyTenantRepository.findByProperty(tenantId, propertyId);
  }

  async update(id: string, tenantId: string, dto: UpdatePropertyTenantDto) {
    const existing = await this.findById(id, tenantId);
    const tenant = await this.propertyTenantRepository.update(id, dto as any);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // If a unitId is newly assigned during update and tenant had no active lease, create lease & schedules
    if (dto.unitId && (!existing.currentLeaseId || existing.unitId !== dto.unitId)) {
      try {
        await this.assignUnitAndCreateLeaseForTenant(tenant, dto, tenantId);
      } catch (err) {
        this.logger.error(`Failed to assign unit ${dto.unitId} during tenant update`, err);
      }
    }

    return this.enrichTenant(await this.propertyTenantRepository.findById(id));
  }

  async remove(id: string, tenantId: string) {
    const tenant = await this.findById(id, tenantId);

    // Release any occupied unit and terminate any active lease for this tenant
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

      // Also release any unit directly referencing this tenant
      await this.unitModel.updateMany(
        {
          $or: [{ currentTenantId: String(id) }, { currentPropertyTenantId: String(id) }],
        },
        {
          $set: {
            currentTenantId: '',
            currentPropertyTenantId: '',
            currentLeaseId: '',
            status: 'vacant',
          },
        },
      );
    } catch (err) {
      this.logger.error(`Failed to clean up leases/units when deleting tenant ${id}`, err);
    }

    return this.propertyTenantRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, active] = await Promise.all([
      this.propertyTenantRepository.countBySystemTenant(tenantId),
      this.propertyTenantRepository.countActive(tenantId),
    ]);
    return { total, active, inactive: total - active };
  }
}
