import { Model } from 'mongoose';
import { UnitRepository } from './repositories/unit.repository';
import { CreateUnitDto, UpdateUnitDto, BulkImportUnitsDto } from './dto/unit.dto';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
export declare class UnitsService {
    private readonly unitRepository;
    private readonly propertyRepository;
    private readonly propertyTenantModel;
    private readonly leaseModel;
    private readonly propertyModel;
    constructor(unitRepository: UnitRepository, propertyRepository: PropertyRepository, propertyTenantModel: Model<PropertyTenant>, leaseModel: Model<Lease>, propertyModel: Model<Property>);
    create(dto: CreateUnitDto, tenantId: string): Promise<import(".").Unit>;
    private enrichUnits;
    findAll(tenantId: string, page?: number, limit?: number, propertyId?: string, status?: string, search?: string, unitType?: string, floor?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, tenantId: string): Promise<any>;
    findByProperty(propertyId: string, tenantId: string): Promise<any[]>;
    update(id: string, tenantId: string, dto: UpdateUnitDto): Promise<import(".").Unit>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string, propertyId?: string): Promise<{
        total: number;
        occupied: number;
        vacant: number;
        maintenance: number;
        available: number;
        occupiedRentTotal: number;
        potentialRentTotal: number;
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
