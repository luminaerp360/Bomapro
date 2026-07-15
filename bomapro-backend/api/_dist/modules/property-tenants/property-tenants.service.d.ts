import { Model } from 'mongoose';
import { PropertyTenantRepository } from './repositories/property-tenant.repository';
import { CreatePropertyTenantDto, UpdatePropertyTenantDto } from './dto/property-tenant.dto';
import { TenantPortalService } from '../tenant-portal/tenant-portal.service';
import { Lease } from '../leases/schemas/lease.schema';
import { Unit } from '../units/schemas/unit.schema';
import { Property } from '../properties/schemas/property.schema';
export declare class PropertyTenantsService {
    private readonly propertyTenantRepository;
    private leaseModel;
    private unitModel;
    private propertyModel;
    private readonly tenantPortalService;
    private readonly logger;
    constructor(propertyTenantRepository: PropertyTenantRepository, leaseModel: Model<Lease>, unitModel: Model<Unit>, propertyModel: Model<Property>, tenantPortalService: TenantPortalService);
    create(dto: CreatePropertyTenantDto, tenantId: string): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, propertyId?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, tenantId: string): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    findByProperty(tenantId: string, propertyId: string): Promise<import("./schemas/property-tenant.schema").PropertyTenant[]>;
    update(id: string, tenantId: string, dto: UpdatePropertyTenantDto): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
}
