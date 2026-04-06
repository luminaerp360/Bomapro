import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Damage } from '../schemas/damage.schema';

@Injectable()
export class DamageRepository extends BaseRepository<Damage> {
  constructor(@InjectModel(Damage.name) model: Model<Damage>) {
    super(model);
  }

  async findByTenant(tenantId: string): Promise<Damage[]> {
    return this.model.find({ tenantId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
  }

  async findByProperty(tenantId: string, propertyId: string): Promise<Damage[]> {
    return this.model.find({ tenantId, propertyId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<Damage[]> {
    return this.model.find({ tenantId, propertyTenantId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
  }

  async findByStatus(tenantId: string, status: string): Promise<Damage[]> {
    return this.model.find({ tenantId, status, isDeleted: false }).sort({ reportedDate: -1 }).exec();
  }

  async getTotalCost(tenantId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { tenantId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$actualCost' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, isDeleted: false });
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments({ tenantId, status, isDeleted: false });
  }

  async countByProperty(tenantId: string, propertyId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, propertyId, isDeleted: false });
  }

  async countByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, propertyId, status, isDeleted: false });
  }

  async getTotalCostByProperty(tenantId: string, propertyId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { tenantId, propertyId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$actualCost' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }
}
