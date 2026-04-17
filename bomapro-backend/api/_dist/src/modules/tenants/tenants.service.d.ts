import { TenantRepository } from './repositories/tenant.repository';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantsService {
    private readonly tenantRepository;
    constructor(tenantRepository: TenantRepository);
    create(dto: CreateTenantDto, ownerUserId: string): Promise<import("./schemas/tenant.schema").Tenant>;
    findAll(): Promise<import("./schemas/tenant.schema").Tenant[]>;
    findById(id: string): Promise<import("./schemas/tenant.schema").Tenant>;
    findBySlug(slug: string): Promise<import("./schemas/tenant.schema").Tenant>;
    findByIds(ids: string[]): Promise<import("./schemas/tenant.schema").Tenant[]>;
    findByOwner(ownerUserId: string): Promise<import("./schemas/tenant.schema").Tenant[]>;
    update(id: string, dto: UpdateTenantDto): Promise<import("./schemas/tenant.schema").Tenant>;
    remove(id: string): Promise<boolean>;
}
