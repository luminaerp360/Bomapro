import { LeasesService } from './leases.service';
import { CreateLeaseDto, UpdateLeaseDto } from './dto/lease.dto';
export declare class LeasesController {
    private readonly leasesService;
    constructor(leasesService: LeasesService);
    create(dto: CreateLeaseDto, req: any): Promise<import("./schemas/lease.schema").Lease>;
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/lease.schema").Lease>>;
    getStats(req: any): Promise<{
        total: number;
        active: number;
        expired: number;
        draft: number;
        expiringSoonCount: number;
    }>;
    getExpiringSoon(req: any, days?: number): Promise<import("./schemas/lease.schema").Lease[]>;
    findByProperty(req: any, propertyId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    findByPropertyTenant(req: any, propertyTenantId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    findByUnit(req: any, unitId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    findOne(id: string, req: any): Promise<import("./schemas/lease.schema").Lease>;
    findWithBalance(id: string, req: any): Promise<{
        lease: import("./schemas/lease.schema").Lease;
        balance: {
            balance: number;
            totalDue: number;
            totalPaid: number;
            totalOverdue: number;
        };
        schedules: import("../rent-schedules/schemas/rent-schedule.schema").RentSchedule[];
    }>;
    update(id: string, dto: UpdateLeaseDto, req: any): Promise<import("./schemas/lease.schema").Lease>;
    activate(id: string, req: any): Promise<import("./schemas/lease.schema").Lease>;
    terminate(id: string, reason: string, req: any): Promise<import("./schemas/lease.schema").Lease>;
    sign(id: string, req: any): Promise<import("./schemas/lease.schema").Lease>;
    remove(id: string, req: any): Promise<boolean>;
}
