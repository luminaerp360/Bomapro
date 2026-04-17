import { UnitRepository } from './repositories/unit.repository';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
export declare class UnitsService {
    private readonly unitRepository;
    constructor(unitRepository: UnitRepository);
    create(dto: CreateUnitDto, tenantId: string): Promise<import(".").Unit>;
    findAll(tenantId: string, page?: number, limit?: number, propertyId?: string, status?: string, search?: string, unitType?: string, floor?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import(".").Unit>>;
    findById(id: string, tenantId: string): Promise<import(".").Unit>;
    findByProperty(propertyId: string, tenantId: string): Promise<import(".").Unit[]>;
    update(id: string, tenantId: string, dto: UpdateUnitDto): Promise<import(".").Unit>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string): Promise<{
        total: number;
        occupied: number;
        available: number;
    }>;
    assignTenant(unitId: string, tenantId: string, propertyTenantId: string, leaseId: string): Promise<import(".").Unit>;
    releaseTenant(unitId: string, tenantId: string): Promise<import(".").Unit>;
    updateStatus(unitId: string, tenantId: string, status: string): Promise<import(".").Unit>;
    findByPropertyTenant(propertyTenantId: string, tenantId: string): Promise<import(".").Unit>;
    findAvailableByProperty(propertyId: string, tenantId: string): Promise<import(".").Unit[]>;
}
