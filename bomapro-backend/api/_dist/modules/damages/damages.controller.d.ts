import { DamagesService } from './damages.service';
import { CreateDamageDto, UpdateDamageDto } from './dto/damage.dto';
export declare class DamagesController {
    private readonly damagesService;
    constructor(damagesService: DamagesService);
    create(dto: CreateDamageDto, req: any): Promise<import("./schemas/damage.schema").Damage>;
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string, severity?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/damage.schema").Damage>>;
    getStats(req: any): Promise<{
        total: number;
        reported: number;
        assessed: number;
        inRepair: number;
        repaired: number;
        totalCost: number;
    }>;
    findByProperty(req: any, propertyId: string): Promise<import("./schemas/damage.schema").Damage[]>;
    findByPropertyTenant(req: any, propertyTenantId: string): Promise<import("./schemas/damage.schema").Damage[]>;
    findOne(id: string, req: any): Promise<import("./schemas/damage.schema").Damage>;
    update(id: string, dto: UpdateDamageDto, req: any): Promise<import("./schemas/damage.schema").Damage>;
    remove(id: string, req: any): Promise<boolean>;
}
