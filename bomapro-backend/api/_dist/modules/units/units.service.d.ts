import { UnitRepository } from './repositories/unit.repository';
import { CreateUnitDto, UpdateUnitDto, BulkImportUnitsDto } from './dto/unit.dto';
import { PropertyRepository } from '../properties/repositories/property.repository';
export declare class UnitsService {
    private readonly unitRepository;
    private readonly propertyRepository;
    constructor(unitRepository: UnitRepository, propertyRepository: PropertyRepository);
    create(dto: CreateUnitDto, tenantId: string): Promise<import(".").Unit>;
    findAll(tenantId: string, page?: number, limit?: number, propertyId?: string, status?: string, search?: string, unitType?: string, floor?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import(".").Unit>>;
    findById(id: string, tenantId: string): Promise<import(".").Unit>;
    findByProperty(propertyId: string, tenantId: string): Promise<import(".").Unit[]>;
    update(id: string, tenantId: string, dto: UpdateUnitDto): Promise<import(".").Unit>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string, propertyId?: string): Promise<{
        total: number;
        occupied: number;
        vacant: number;
        maintenance: number;
        available: number;
    }>;
    assignTenant(unitId: string, tenantId: string, propertyTenantId: string, leaseId: string): Promise<import(".").Unit>;
    releaseTenant(unitId: string, tenantId: string): Promise<import(".").Unit>;
    updateStatus(unitId: string, tenantId: string, status: string): Promise<import(".").Unit>;
    findByPropertyTenant(propertyTenantId: string, tenantId: string): Promise<import(".").Unit>;
    findAvailableByProperty(propertyId: string, tenantId: string): Promise<import(".").Unit[]>;
    bulkImport(dto: BulkImportUnitsDto, tenantId: string): Promise<{
        success: boolean;
        message: string;
        total: number;
        created: number;
        updated: number;
        skipped: number;
        propertiesAffected: string[];
    }>;
    private parseCsvText;
    private parseCsvLine;
}
