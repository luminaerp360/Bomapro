import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyTenantRepository } from './repositories/property-tenant.repository';
import { CreatePropertyTenantDto, UpdatePropertyTenantDto } from './dto/property-tenant.dto';
import { TenantPortalService } from '../tenant-portal/tenant-portal.service';
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
    @Inject(forwardRef(() => TenantPortalService)) private readonly tenantPortalService: TenantPortalService,
  ) {}

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

    // If unitId is provided, assign unit and create active lease
    if (dto.unitId) {
      try {
        const unit = await this.unitModel.findById(dto.unitId).exec();
        if (unit) {
          const propertyId = dto.propertyId || unit.propertyId;
          const lease = await this.leaseModel.create({
            tenantId,
            propertyTenantId: String(tenant._id),
            unitId: String(unit._id),
            propertyId: String(propertyId),
            leaseNumber: `LSE-${Date.now().toString().slice(-6)}`,
            status: 'active',
            startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
            rentAmount: dto.rentAmount !== undefined ? dto.rentAmount : unit.rentAmount,
            depositAmount: dto.depositAmount !== undefined ? dto.depositAmount : (unit.securityDeposit || 0),
            currency: unit.currency || 'KES',
          });

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
        }
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

    return tenant;
  }

<<<<<<< HEAD
=======
  private async enrichTenant(tenant: any): Promise<any> {
    const enriched = tenant?.toObject ? tenant.toObject() : { ...tenant };

    // Fetch unit and property information if tenant has a current lease
    if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
      try {
        const lease = await this.leaseModel.findById(enriched.currentLeaseId).exec();
        if (lease) {
          if (lease.rentAmount !== undefined && !enriched.rentAmount) enriched.rentAmount = lease.rentAmount;
          if (lease.currency && !enriched.currency) enriched.currency = lease.currency;
          if (lease.unitId) {
            const unit = await this.unitModel.findById(lease.unitId).exec();
            if (unit) {
              enriched.unitNumber = unit.unitNumber;
              enriched.unitId = String(unit._id);
              if (!enriched.rentAmount && unit.rentAmount) enriched.rentAmount = unit.rentAmount;
              if (!enriched.currency && unit.currency) enriched.currency = unit.currency;
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

>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
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

    const enrichedData = await Promise.all(
<<<<<<< HEAD
      result.data.map(async (tenant: any) => {
        const enriched = tenant.toObject ? tenant.toObject() : tenant;
        
        // Fetch unit and property information if tenant has a current lease
        if (enriched.currentLeaseId && String(enriched.currentLeaseId).trim()) {
          try {
            const lease = await this.leaseModel.findById(enriched.currentLeaseId).exec();
            if (lease && lease.unitId) {
              const unit = await this.unitModel.findById(lease.unitId).exec();
              if (unit) {
                enriched.unitNumber = unit.unitNumber;
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
      }),
=======
      result.data.map((t: any) => this.enrichTenant(t)),
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
    );

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
    await this.findById(id, tenantId);
    const tenant = await this.propertyTenantRepository.update(id, dto as any);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
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
