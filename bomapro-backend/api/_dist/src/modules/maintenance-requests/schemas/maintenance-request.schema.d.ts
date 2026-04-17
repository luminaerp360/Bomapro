import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum MaintenanceRequestStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed",
    REJECTED = "rejected"
}
export declare enum MaintenanceRequestPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class MaintenanceRequest extends BaseDocument {
    tenantId: string;
    propertyTenantId: string;
    unitId: string;
    propertyId: string;
    title: string;
    description: string;
    status: MaintenanceRequestStatus;
    priority: MaintenanceRequestPriority;
    attachments: string[];
    assignedToUserId: string;
    completedAt: Date;
    completionNotes: string;
    propertyTenantName: string;
    unitNumber: string;
    dueDate: Date;
    estimatedCost: number;
}
export declare const MaintenanceRequestSchema: import("mongoose").Schema<MaintenanceRequest, import("mongoose").Model<MaintenanceRequest, any, any, any, import("mongoose").Document<unknown, any, MaintenanceRequest, any, {}> & MaintenanceRequest & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MaintenanceRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<MaintenanceRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MaintenanceRequest> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
