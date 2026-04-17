import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum ScheduleStatus {
    UNPAID = "unpaid",
    PARTIAL = "partial",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare class RentSchedule extends BaseDocument {
    tenantId: string;
    leaseId: string;
    propertyId: string;
    unitId: string;
    dueDate: Date;
    amount: number;
    paidAmount: number;
    status: ScheduleStatus;
    month: string;
    dueWithGracePeriodDate?: Date;
    lateFeeApplied: number;
    payments: Array<{
        paymentId: string;
        amount: number;
        paymentDate: Date;
        paymentMethod: string;
    }>;
}
export declare const RentScheduleSchema: import("mongoose").Schema<RentSchedule, import("mongoose").Model<RentSchedule, any, any, any, import("mongoose").Document<unknown, any, RentSchedule, any, {}> & RentSchedule & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RentSchedule, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RentSchedule>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<RentSchedule> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
