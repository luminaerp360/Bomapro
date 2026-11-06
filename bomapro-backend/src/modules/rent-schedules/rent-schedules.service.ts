import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';
import { ScheduleStatus } from './schemas/rent-schedule.schema';

export interface CreateScheduleDto {
  leaseId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  dueDate: Date;
  amount: number;
  month: string;
  gracePeriodDays?: number;
}

@Injectable()
export class RentSchedulesService {
  constructor(private readonly scheduleRepository: RentScheduleRepository) {}

  async createSchedule(dto: CreateScheduleDto) {
    const dueWithGracePeriodDate = new Date(dto.dueDate);
    dueWithGracePeriodDate.setDate(dueWithGracePeriodDate.getDate() + (dto.gracePeriodDays || 5));

    return this.scheduleRepository.create({
      ...dto,
      paidAmount: 0,
      status: ScheduleStatus.UNPAID,
      dueWithGracePeriodDate,
    } as any);
  }

  async generateSchedulesForLease(
    leaseId: string,
    tenantId: string,
    propertyId: string,
    unitId: string,
    startDate: Date,
    rentAmount: number,
    gracePeriodDays: number = 5,
    months: number = 12,
  ) {
    const schedules = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, currentDate.getDate());
      const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

      const schedule = await this.createSchedule({
        leaseId,
        tenantId,
        propertyId,
        unitId,
        dueDate,
        amount: rentAmount,
        month,
        gracePeriodDays,
      });

      schedules.push(schedule);
    }

    return schedules;
  }

  async findByLease(tenantId: string, leaseId: string) {
    return this.scheduleRepository.findByLease(tenantId, leaseId);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.scheduleRepository.findByProperty(tenantId, propertyId);
  }

  async findByUnit(tenantId: string, unitId: string) {
    return this.scheduleRepository.findByUnit(tenantId, unitId);
  }

  async findOverdue(tenantId: string) {
    return this.scheduleRepository.findOverdue(tenantId);
  }

  async getLeaseBalance(tenantId: string, leaseId: string) {
    const totals = await this.scheduleRepository.getTotalByLease(tenantId, leaseId);
    return {
      ...totals,
      balance: Math.max(0, totals.totalDue - totals.totalPaid),
      contractBalance: Math.max(0, (totals.totalContractAmount || totals.totalDue) - totals.totalPaid),
    };
  }

  async recordPayment(
    tenantId: string,
    leaseId: string,
    paymentAmount: number,
    paymentId: string,
    paymentDate: Date,
    paymentMethod: string,
  ) {
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    let remainingAmount = paymentAmount;
    const schedules = await this.findByLease(tenantId, leaseId);

    // Sort by dueDate to apply payments in order
    schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    for (const schedule of schedules) {
      if (remainingAmount <= 0) break;

      const amountNeeded = schedule.amount - schedule.paidAmount;

      if (amountNeeded > 0) {
        const amountToApply = Math.min(remainingAmount, amountNeeded);

        // Update schedule
        const updatedPaidAmount = schedule.paidAmount + amountToApply;
        let newStatus = schedule.status;

        if (updatedPaidAmount >= schedule.amount) {
          newStatus = ScheduleStatus.PAID;
        } else if (updatedPaidAmount > 0) {
          newStatus = ScheduleStatus.PARTIAL;
        } else {
          newStatus = ScheduleStatus.UNPAID;
        }

        // Add payment to the payments array
        const payments = schedule.payments || [];
        payments.push({
          paymentId,
          amount: amountToApply,
          paymentDate,
          paymentMethod,
        });

        // Check if overdue
        const now = new Date();
        if (newStatus !== ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
          newStatus = ScheduleStatus.OVERDUE;
        }

        await this.scheduleRepository.update(schedule._id.toString(), {
          paidAmount: updatedPaidAmount,
          status: newStatus,
          payments,
        } as any);

        remainingAmount -= amountToApply;
      }
    }

    // Return any overpayment that wasn't applied
    return {
      success: true,
      appliedAmount: paymentAmount - remainingAmount,
      overpayment: remainingAmount > 0 ? remainingAmount : 0,
    };
  }

  async updateScheduleStatus(scheduleId: string, tenantId: string) {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      throw new NotFoundException('Schedule not found');
    }

    let status = ScheduleStatus.UNPAID;
    if (schedule.paidAmount >= schedule.amount) {
      status = ScheduleStatus.PAID;
    } else if (schedule.paidAmount > 0) {
      status = ScheduleStatus.PARTIAL;
    }

    // Check if overdue
    const now = new Date();
    if (status !== ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
      status = ScheduleStatus.OVERDUE;
    }

    return this.scheduleRepository.update(scheduleId, { status } as any);
  }

  async delete(scheduleId: string, tenantId: string) {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      throw new NotFoundException('Schedule not found');
    }
    return this.scheduleRepository.delete(scheduleId);
  }

  async cancelFutureSchedulesForLease(tenantId: string, leaseId: string, terminationDate = new Date()) {
    await this.scheduleRepository.cancelFutureUnpaidByLease(tenantId, leaseId, terminationDate);
  }

  async deleteSchedulesForLease(tenantId: string, leaseId: string) {
    await this.scheduleRepository.deleteAllByLease(tenantId, leaseId);
  }
}
