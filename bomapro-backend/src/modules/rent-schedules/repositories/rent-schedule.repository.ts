import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { RentSchedule } from '../schemas/rent-schedule.schema';

@Injectable()
export class RentScheduleRepository extends BaseRepository<RentSchedule> {
  constructor(@InjectModel(RentSchedule.name) model: Model<RentSchedule>) {
    super(model);
  }

  async findByLease(tenantId: string, leaseId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, leaseId, isDeleted: false })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findByProperty(tenantId: string, propertyId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, propertyId, isDeleted: false })
      .sort({ dueDate: -1 })
      .exec();
  }

  async findByUnit(tenantId: string, unitId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, unitId, isDeleted: false })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findOverdue(tenantId: string): Promise<RentSchedule[]> {
    const now = new Date();
    return this.model
      .find({
        tenantId,
        dueWithGracePeriodDate: { $lt: now },
        status: { $in: ['unpaid', 'partial'] },
        isDeleted: false,
      })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findByStatus(tenantId: string, status: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, status, isDeleted: false })
      .sort({ dueDate: -1 })
      .exec();
  }

  async findNextUnpaidSchedule(leaseId: string): Promise<RentSchedule | null> {
    const now = new Date();
    return this.model
      .findOne({
        leaseId,
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $lte: now },
        isDeleted: false,
      })
      .sort({ dueDate: 1 })
      .exec();
  }

  async getTotalByLease(tenantId: string, leaseId: string): Promise<{
    totalDue: number;
    totalPaid: number;
    totalOverdue: number;
    totalContractAmount: number;
  }> {
    const schedules = await this.findByLease(tenantId, leaseId);
    let totalDue = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalContractAmount = 0;

    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    schedules.forEach((schedule, index) => {
      totalContractAmount += schedule.amount;
      totalPaid += schedule.paidAmount;

      const dueDate = new Date(schedule.dueDate);
      // Count schedule as due if its dueDate falls on or before the end of the current month
      // (or always include the first month's schedule once the lease exists)
      if (dueDate <= endOfCurrentMonth || index === 0) {
        totalDue += schedule.amount;
      }

      if (
        schedule.status !== 'paid' &&
        (schedule.status === 'overdue' ||
          (schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now))
      ) {
        totalOverdue += Math.max(0, schedule.amount - schedule.paidAmount);
      }
    });

    return { totalDue, totalPaid, totalOverdue, totalContractAmount };
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments({ tenantId, status, isDeleted: false });
  }

  async cancelFutureUnpaidByLease(tenantId: string, leaseId: string, afterDate: Date): Promise<void> {
    await this.model.updateMany(
      {
        tenantId,
        leaseId,
        dueDate: { $gt: afterDate },
        paidAmount: 0,
        isDeleted: false,
      },
      { $set: { isDeleted: true } },
    );
  }

  async deleteAllByLease(tenantId: string, leaseId: string): Promise<void> {
    await this.model.updateMany(
      { tenantId, leaseId, isDeleted: false },
      { $set: { isDeleted: true } },
    );
  }
}
