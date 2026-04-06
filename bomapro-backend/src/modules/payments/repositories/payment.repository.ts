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
}
