import { MaintenanceRequestsService } from './maintenance-requests.service';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, CompleteMaintenanceRequestDto } from './dto/maintenance-request.dto';
export declare class MaintenanceRequestsController {
    private maintenanceRequestsService;
    constructor(maintenanceRequestsService: MaintenanceRequestsService);
    create(req: any, dto: CreateMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getAll(req: any, page?: number, limit?: number, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getByUnit(req: any, unitId: string, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getById(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(req: any, id: string, dto: UpdateMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    complete(req: any, id: string, dto: CompleteMaintenanceRequestDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    assign(req: any, id: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    delete(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/maintenance-request.schema").MaintenanceRequest, {}, {}> & import("./schemas/maintenance-request.schema").MaintenanceRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getStats(req: any): Promise<{
        pending: number;
        inProgress: number;
        resolved: number;
        total: number;
    }>;
}
