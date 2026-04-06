import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { PropertyTenant } from '../schemas/property-tenant.schema';

@Injectable()
export class PropertyTenantRepository extends BaseRepository<PropertyTenant> {
  constructor(@InjectModel(PropertyTenant.name) model: Model<PropertyTenant>) {
    super(model);
  }

  async findBySystemTenant(tenantId: string): Promise<PropertyTenant[]> {
    return this.model.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findByProperty(tenantId: string, propertyId: string): Promise<PropertyTenant[]> {
    return this.model.find({ tenantId, currentPropertyId: propertyId, isDeleted: false }).exec();
  }

  async findByEmail(tenantId: string, email: string): Promise<PropertyTenant | null> {
    return this.model.findOne({ tenantId, email, isDeleted: false }).exec();
  }

  async countBySystemTenant(tenantId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, isDeleted: false });
  }

  async countActive(tenantId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, isActive: true, isDeleted: false });
  }

  async countByProperty(tenantId: string, propertyId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, currentPropertyId: propertyId, isDeleted: false });
  }

  async countActiveByProperty(tenantId: string, propertyId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, currentPropertyId: propertyId, isActive: true, isDeleted: false });
  }
}
