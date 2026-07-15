import { DamageRepository } from './repositories/damage.repository';
import { CreateDamageDto, UpdateDamageDto } from './dto/damage.dto';
export declare class DamagesService {
    private readonly damageRepository;
    constructor(damageRepository: DamageRepository);
    create(dto: CreateDamageDto, tenantId: string, reportedBy: string): Promise<import("./schemas/damage.schema").Damage>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, status?: string, severity?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/damage.schema").Damage>>;
    findById(id: string, tenantId: string): Promise<import("./schemas/damage.schema").Damage>;
    findByProperty(tenantId: string, propertyId: string): Promise<import("./schemas/damage.schema").Damage[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<import("./schemas/damage.schema").Damage[]>;
    update(id: string, tenantId: string, dto: UpdateDamageDto): Promise<import("./schemas/damage.schema").Damage>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string): Promise<{
        total: number;
        reported: number;
        assessed: number;
        inRepair: number;
        repaired: number;
        totalCost: number;
    }>;
}
