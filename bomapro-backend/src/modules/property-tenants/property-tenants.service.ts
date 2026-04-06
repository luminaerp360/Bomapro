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
    const existing = await this.propertyTenantRepository.findByEmail(tenantId, dto.email);
    if (existing) {
      throw new ConflictException('A tenant with this email already exists');
    }
    const tenant = await this.propertyTenantRepository.create({ ...dto, tenantId } as any);

    // Send tenant portal invite email
    try {
      const { token } = await this.tenantPortalService.generateAndSaveInviteToken(tenant);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const link = `${frontendUrl}/tenant-portal/setup-password?token=${token}`;
      await this.tenantPortalService.sendPortalInviteEmail(tenant.email, tenant.name, link);
    } catch (err) {
      this.logger.error(`Failed to send portal invite to ${dto.email}`, err);
    }

    return tenant;
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
    
    // Enrich with unit and property information
    const enrichedData = await Promise.all(
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
    return tenant;
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
