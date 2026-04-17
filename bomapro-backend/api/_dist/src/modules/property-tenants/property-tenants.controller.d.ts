import { PropertyTenantsService } from './property-tenants.service';
import { CreatePropertyTenantDto, UpdatePropertyTenantDto } from './dto/property-tenant.dto';
export declare class PropertyTenantsController {
    private readonly propertyTenantsService;
    constructor(propertyTenantsService: PropertyTenantsService);
    create(dto: CreatePropertyTenantDto, req: any): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    findAll(req: any, page?: number, limit?: number, search?: string, propertyId?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
    findByProperty(req: any, propertyId: string): Promise<import("./schemas/property-tenant.schema").PropertyTenant[]>;
    findOne(id: string, req: any): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    update(id: string, dto: UpdatePropertyTenantDto, req: any): Promise<import("./schemas/property-tenant.schema").PropertyTenant>;
    remove(id: string, req: any): Promise<boolean>;
}
