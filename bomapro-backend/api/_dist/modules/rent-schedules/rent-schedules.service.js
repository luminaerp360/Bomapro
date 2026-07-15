"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const rent_schedule_repository_1 = require("./repositories/rent-schedule.repository");
const rent_schedule_schema_1 = require("./schemas/rent-schedule.schema");
let RentSchedulesService = class RentSchedulesService {
    constructor(scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }
    async createSchedule(dto) {
        const dueWithGracePeriodDate = new Date(dto.dueDate);
        dueWithGracePeriodDate.setDate(dueWithGracePeriodDate.getDate() + (dto.gracePeriodDays || 5));
        return this.scheduleRepository.create({
            ...dto,
            paidAmount: 0,
            status: rent_schedule_schema_1.ScheduleStatus.UNPAID,
            dueWithGracePeriodDate,
        });
    }
    async generateSchedulesForLease(leaseId, tenantId, propertyId, unitId, startDate, rentAmount, gracePeriodDays = 5, months = 12) {
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
    async findByLease(tenantId, leaseId) {
        return this.scheduleRepository.findByLease(tenantId, leaseId);
    }
    async findByProperty(tenantId, propertyId) {
        return this.scheduleRepository.findByProperty(tenantId, propertyId);
    }
    async findByUnit(tenantId, unitId) {
        return this.scheduleRepository.findByUnit(tenantId, unitId);
    }
    async findOverdue(tenantId) {
        return this.scheduleRepository.findOverdue(tenantId);
    }
    async getLeaseBalance(tenantId, leaseId) {
        const totals = await this.scheduleRepository.getTotalByLease(tenantId, leaseId);
        return {
            ...totals,
            balance: totals.totalDue - totals.totalPaid,
        };
    }
    async recordPayment(tenantId, leaseId, paymentAmount, paymentId, paymentDate, paymentMethod) {
        if (paymentAmount <= 0) {
            throw new common_1.BadRequestException('Payment amount must be greater than 0');
        }
        let remainingAmount = paymentAmount;
        const schedules = await this.findByLease(tenantId, leaseId);
        schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        for (const schedule of schedules) {
            if (remainingAmount <= 0)
                break;
            const amountNeeded = schedule.amount - schedule.paidAmount;
            if (amountNeeded > 0) {
                const amountToApply = Math.min(remainingAmount, amountNeeded);
                const updatedPaidAmount = schedule.paidAmount + amountToApply;
                let newStatus = schedule.status;
                if (updatedPaidAmount >= schedule.amount) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.PAID;
                }
                else if (updatedPaidAmount > 0) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.PARTIAL;
                }
                else {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.UNPAID;
                }
                const payments = schedule.payments || [];
                payments.push({
                    paymentId,
                    amount: amountToApply,
                    paymentDate,
                    paymentMethod,
                });
                const now = new Date();
                if (newStatus !== rent_schedule_schema_1.ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
                }
                await this.scheduleRepository.update(schedule._id.toString(), {
                    paidAmount: updatedPaidAmount,
                    status: newStatus,
                    payments,
                });
                remainingAmount -= amountToApply;
            }
        }
        return {
            success: true,
            appliedAmount: paymentAmount - remainingAmount,
            overpayment: remainingAmount > 0 ? remainingAmount : 0,
        };
    }
    async updateScheduleStatus(scheduleId, tenantId) {
        const schedule = await this.scheduleRepository.findById(scheduleId);
        if (!schedule || schedule.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        let status = rent_schedule_schema_1.ScheduleStatus.UNPAID;
        if (schedule.paidAmount >= schedule.amount) {
            status = rent_schedule_schema_1.ScheduleStatus.PAID;
        }
        else if (schedule.paidAmount > 0) {
            status = rent_schedule_schema_1.ScheduleStatus.PARTIAL;
        }
        const now = new Date();
        if (status !== rent_schedule_schema_1.ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
            status = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
        }
        return this.scheduleRepository.update(scheduleId, { status });
    }
    async delete(scheduleId, tenantId) {
        const schedule = await this.scheduleRepository.findById(scheduleId);
        if (!schedule || schedule.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        return this.scheduleRepository.delete(scheduleId);
    }
};
exports.RentSchedulesService = RentSchedulesService;
exports.RentSchedulesService = RentSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rent_schedule_repository_1.RentScheduleRepository])
], RentSchedulesService);
//# sourceMappingURL=rent-schedules.service.js.map