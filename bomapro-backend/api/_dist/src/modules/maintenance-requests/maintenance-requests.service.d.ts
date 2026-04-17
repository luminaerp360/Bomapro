import { Model } from 'mongoose';
import { MaintenanceRequest } from './schemas/maintenance-request.schema';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, CompleteMaintenanceRequestDto } from './dto/maintenance-request.dto';
export declare class MaintenanceRequestsService {
    private maintenanceRequestModel;
    constructor(maintenanceRequestModel: Model<MaintenanceRequest>);
    create(tenantId: string, propertyTenantId: string, dto: CreateMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getById(id: string, tenantId: string, propertyTenantId?: string): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getByTenant(tenantId: string, page?: number, limit?: number, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getByPropertyTenant(tenantId: string, propertyTenantId: string, page?: number, limit?: number, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getByUnit(tenantId: string, unitId: string, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    update(id: string, tenantId: string, dto: UpdateMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    complete(id: string, tenantId: string, dto: CompleteMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    assignRequest(id: string, tenantId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    delete(id: string, tenantId: string): Promise<import("mongoose").Document<unknown, {}, MaintenanceRequest, {}, {}> & MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getStats(tenantId: string): Promise<{
        pending: number;
        inProgress: number;
        resolved: number;
        total: number;
    }>;
}
