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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentScheduleRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const rent_schedule_schema_1 = require("../schemas/rent-schedule.schema");
let RentScheduleRepository = class RentScheduleRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findByLease(tenantId, leaseId) {
        return this.model
            .find({ tenantId, leaseId, isDeleted: false })
            .sort({ dueDate: 1 })
            .exec();
    }
    async findByProperty(tenantId, propertyId) {
        return this.model
            .find({ tenantId, propertyId, isDeleted: false })
            .sort({ dueDate: -1 })
            .exec();
    }
    async findByUnit(tenantId, unitId) {
        return this.model
            .find({ tenantId, unitId, isDeleted: false })
            .sort({ dueDate: 1 })
            .exec();
    }
    async findOverdue(tenantId) {
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
    async findByStatus(tenantId, status) {
        return this.model
            .find({ tenantId, status, isDeleted: false })
            .sort({ dueDate: -1 })
            .exec();
    }
    async findNextUnpaidSchedule(leaseId) {
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
    async getTotalByLease(tenantId, leaseId) {
        const schedules = await this.findByLease(tenantId, leaseId);
        let totalDue = 0;
        let totalPaid = 0;
        let totalOverdue = 0;
        const now = new Date();
        schedules.forEach((schedule) => {
            totalDue += schedule.amount;
            totalPaid += schedule.paidAmount;
            if (schedule.status === 'overdue' || (schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now)) {
                totalOverdue += schedule.amount - schedule.paidAmount;
            }
        });
        return { totalDue, totalPaid, totalOverdue };
    }
    async countByStatus(tenantId, status) {
        return this.model.countDocuments({ tenantId, status, isDeleted: false });
    }
};
exports.RentScheduleRepository = RentScheduleRepository;
exports.RentScheduleRepository = RentScheduleRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rent_schedule_schema_1.RentSchedule.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RentScheduleRepository);
//# sourceMappingURL=rent-schedule.repository.js.map