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

  async getDashboardDamageBreakdown(tenantId: string, propertyId?: string) {
    const match: any = { tenantId, isDeleted: false };
    if (propertyId) {
      match.propertyId = propertyId;
    }

    const [byStatusRaw, costAgg, recent] = await Promise.all([
      this.model.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            estimatedCost: { $sum: { $ifNull: ['$estimatedCost', 0] } },
            actualCost: { $sum: { $ifNull: ['$actualCost', 0] } },
          },
        },
      ]),
      this.model.find(match).sort({ reportedDate: -1, createdAt: -1 }).limit(5).lean().exec(),
    ]);

    const counts: Record<string, number> = {};
    for (const row of byStatusRaw) {
      counts[row._id || 'reported'] = row.count || 0;
    }

    return {
      reported: counts['reported'] || 0,
      assessed: counts['assessed'] || 0,
      inRepair: counts['in_repair'] || 0,
      repaired: counts['repaired'] || 0,
      estimatedCost: costAgg[0]?.estimatedCost || 0,
      actualCost: costAgg[0]?.actualCost || 0,
      recent,
    };
  }
}
