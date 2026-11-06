import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Payment } from '../schemas/payment.schema';

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  constructor(@InjectModel(Payment.name) model: Model<Payment>) {
    super(model);
  }

  async findByTenant(tenantId: string): Promise<Payment[]> {
    return this.model.find({ tenantId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
  }

  async findByLease(tenantId: string, leaseId: string): Promise<Payment[]> {
    return this.model.find({ tenantId, leaseId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
  }

  async findByProperty(tenantId: string, propertyId: string): Promise<Payment[]> {
    return this.model.find({ tenantId, propertyId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<Payment[]> {
    return this.model.find({ tenantId, propertyTenantId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<Payment[]> {
    return this.model.find({
      tenantId,
      paymentDate: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    }).sort({ paymentDate: -1 }).exec();
  }

  async getTotalByStatus(tenantId: string, status: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { tenantId, status, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getMonthlyRevenue(tenantId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await this.model.aggregate([
      {
        $match: {
          tenantId,
          status: 'completed',
          paymentDate: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getAnnualMonthlyRevenue(
    tenantId: string,
    year: number,
    propertyId?: string,
  ): Promise<Array<{ month: number; revenue: number }>> {
    const startDate = new Date(year, 0, 1, 0, 0, 0);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const match: any = {
      tenantId,
      status: 'completed',
      paymentDate: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (propertyId) {
      match.propertyId = propertyId;
    }

    const rows = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          revenue: { $sum: '$amount' },
        },
      },
    ]);

    const byMonth = new Map<number, number>();
    for (const row of rows) {
      byMonth.set(row._id, row.revenue || 0);
    }

    const months: Array<{ month: number; revenue: number }> = [];
    for (let m = 1; m <= 12; m++) {
      months.push({ month: m, revenue: byMonth.get(m) || 0 });
    }
    return months;
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

  async getMonthlyRevenueByProperty(tenantId: string, year: number, month: number, propertyId: string): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await this.model.aggregate([
      { $match: { tenantId, propertyId, status: 'completed', paymentDate: { $gte: startDate, $lte: endDate }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getTotalByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { tenantId, propertyId, status, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getDashboardPaymentBreakdown(
    tenantId: string,
    propertyId?: string,
  ): Promise<{
    byMethod: Array<{ method: string; amount: number; count: number }>;
    byStatus: Array<{ status: string; amount: number; count: number }>;
    byProperty: Array<{ propertyId: string; propertyName: string; amount: number; count: number }>;
    recent: Payment[];
  }> {
    const match: any = { tenantId, isDeleted: false };
    if (propertyId) {
      match.propertyId = propertyId;
    }

    const [byMethodRaw, byStatusRaw, byPropertyRaw, recent] = await Promise.all([
      this.model.aggregate([
        { $match: { ...match, status: 'completed' } },
        {
          $group: {
            _id: { $ifNull: ['$paymentMethod', 'other'] },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      this.model.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ['$status', 'pending'] },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.model.aggregate([
        { $match: { ...match, status: 'completed' } },
        {
          $group: {
            _id: '$propertyId',
            propertyName: { $first: '$propertyName' },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
        { $limit: 8 },
      ]),
      this.model.find(match).sort({ paymentDate: -1, createdAt: -1 }).limit(6).lean().exec(),
    ]);

    return {
      byMethod: byMethodRaw.map((r) => ({
        method: r._id || 'other',
        amount: r.amount || 0,
        count: r.count || 0,
      })),
      byStatus: byStatusRaw.map((r) => ({
        status: r._id || 'pending',
        amount: r.amount || 0,
        count: r.count || 0,
      })),
      byProperty: byPropertyRaw.map((r) => ({
        propertyId: r._id || '',
        propertyName: r.propertyName || 'Unassigned Property',
        amount: r.amount || 0,
        count: r.count || 0,
      })),
      recent: recent as any,
    };
  }
}
