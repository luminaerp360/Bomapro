import { LeaseRepository } from './repositories/lease.repository';
import { CreateLeaseDto, UpdateLeaseDto } from './dto/lease.dto';
import { UnitsService } from '../units/units.service';
import { PropertyTenantsService } from '../property-tenants/property-tenants.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
export declare class LeasesService {
    private readonly leaseRepository;
    private readonly unitsService;
    private readonly propertyTenantsService;
    private readonly rentSchedulesService;
    constructor(leaseRepository: LeaseRepository, unitsService: UnitsService, propertyTenantsService: PropertyTenantsService, rentSchedulesService: RentSchedulesService);
    create(dto: CreateLeaseDto, tenantId: string): Promise<import("./schemas/lease.schema").Lease>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, status?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/lease.schema").Lease>>;
    findById(id: string, tenantId: string): Promise<import("./schemas/lease.schema").Lease>;
    findWithBalance(id: string, tenantId: string): Promise<{
        lease: import("./schemas/lease.schema").Lease;
        balance: {
            balance: number;
            totalDue: number;
            totalPaid: number;
            totalOverdue: number;
        };
        schedules: import("../rent-schedules/schemas/rent-schedule.schema").RentSchedule[];
    }>;
    findByProperty(tenantId: string, propertyId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    findExpiringSoon(tenantId: string, days?: number): Promise<import("./schemas/lease.schema").Lease[]>;
    findByUnit(tenantId: string, unitId: string): Promise<import("./schemas/lease.schema").Lease[]>;
    activate(id: string, tenantId: string): Promise<import("./schemas/lease.schema").Lease>;
    terminate(id: string, tenantId: string, reason: string): Promise<import("./schemas/lease.schema").Lease>;
    update(id: string, tenantId: string, dto: UpdateLeaseDto): Promise<import("./schemas/lease.schema").Lease>;
    remove(id: string, tenantId: string): Promise<boolean>;
    signLease(id: string, propertyTenantId: string, tenantId: string): Promise<import("./schemas/lease.schema").Lease>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        expired: number;
        draft: number;
        expiringSoonCount: number;
    }>;
    private generateLeaseNumber;
}
