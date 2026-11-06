import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Unit } from '../schemas/unit.schema';

@Injectable()
export class UnitRepository extends BaseRepository<Unit> {
  constructor(@InjectModel(Unit.name) model: Model<Unit>) {
    super(model);
  }

  async findByProperty(propertyId: string, tenantId: string): Promise<Unit[]> {
    return this.model
      .find({ propertyId, tenantId, isDeleted: false })
      .sort({ unitNumber: 1 })
      .exec();
  }

  async findByPropertyId(propertyId: string): Promise<Unit[]> {
    return this.model
      .find({ propertyId, isDeleted: false })
      .sort({ unitNumber: 1 })
      .exec();
  }

  async findByTenant(tenantId: string): Promise<Unit[]> {
    return this.model
      .find({ tenantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(tenantId: string, status: string): Promise<Unit[]> {
    return this.model
      .find({ tenantId, status, isDeleted: false })
      .sort({ unitNumber: 1 })
      .exec();
  }

  async findOccupied(tenantId: string): Promise<Unit[]> {
    return this.model
      .find({
        tenantId,
        status: 'occupied',
        currentTenantId: { $ne: '' },
        isDeleted: false,
      })
      .sort({ unitNumber: 1 })
      .exec();
  }

  async findAvailable(propertyId: string, tenantId: string): Promise<Unit[]> {
    return this.model
      .find({
        propertyId,
        tenantId,
        status: 'vacant',
        currentTenantId: '',
        isDeleted: false,
      })
      .sort({ unitNumber: 1 })
      .exec();
  }

  async findByPropertyTenant(propertyTenantId: string, tenantId: string): Promise<Unit | null> {
    return this.model
      .findOne({
        currentPropertyTenantId: propertyTenantId,
        tenantId,
        isDeleted: false,
      })
      .exec();
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, isDeleted: false });
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments({ tenantId, status, isDeleted: false });
  }

  async countByProperty(propertyId: string, tenantId: string): Promise<number> {
    return this.model.countDocuments({ propertyId, tenantId, isDeleted: false });
  }

  async countOccupied(tenantId: string): Promise<number> {
    return this.model.countDocuments({
      tenantId,
      status: 'occupied',
      currentTenantId: { $ne: '' },
      isDeleted: false,
    });
  }

  async countAvailable(tenantId: string): Promise<number> {
    return this.model.countDocuments({
      tenantId,
      status: 'vacant',
      currentTenantId: '',
      isDeleted: false,
    });
  }

  async getUnitStats(tenantId: string, propertyId?: string): Promise<{
    total: number;
    occupied: number;
    vacant: number;
    maintenance: number;
    available: number;
    occupiedRentTotal: number;
    potentialRentTotal: number;
  }> {
    const filter: any = { tenantId, isDeleted: false };
    if (propertyId) {
      filter.propertyId = propertyId;
    }

    const [total, occupied, vacantRaw, maintenance, rentAgg] = await Promise.all([
      this.model.countDocuments(filter),
      this.model.countDocuments({ ...filter, status: 'occupied' }),
      this.model.countDocuments({ ...filter, status: { $in: ['vacant', 'available'] } }),
      this.model.countDocuments({ ...filter, status: 'maintenance' }),
      this.model.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            potentialRentTotal: { $sum: { $ifNull: ['$rentAmount', 0] } },
            occupiedRentTotal: {
              $sum: {
                $cond: [{ $eq: ['$status', 'occupied'] }, { $ifNull: ['$rentAmount', 0] }, 0],
              },
            },
          },
        },
      ]),
    ]);

    const vacant = vacantRaw > 0 ? vacantRaw : Math.max(0, total - occupied - maintenance);
    const occupiedRentTotal = rentAgg.length > 0 ? rentAgg[0].occupiedRentTotal || 0 : 0;
    const potentialRentTotal = rentAgg.length > 0 ? rentAgg[0].potentialRentTotal || 0 : 0;

    return {
      total,
      occupied,
      vacant,
      maintenance,
      available: vacant,
      occupiedRentTotal,
      potentialRentTotal,
    };
  }

}