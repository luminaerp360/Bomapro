import { MaintenanceRequestStatus, MaintenanceRequestPriority } from '../schemas/maintenance-request.schema';
export declare class CreateMaintenanceRequestDto {
    unitId: string;
    propertyId: string;
    title: string;
    description: string;
    priority?: MaintenanceRequestPriority;
    attachments?: string[];
    dueDate?: Date;
    estimatedCost?: number;
}
export declare class UpdateMaintenanceRequestDto {
    title?: string;
    description?: string;
    status?: MaintenanceRequestStatus;
    priority?: MaintenanceRequestPriority;
    assignedToUserId?: string;
    completionNotes?: string;
    attachments?: string[];
    dueDate?: Date;
    estimatedCost?: number;
}
export declare class CompleteMaintenanceRequestDto {
    completionNotes: string;
    attachments?: string[];
}
