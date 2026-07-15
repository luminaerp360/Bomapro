import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { AuthService } from '../auth/auth.service';
export declare class TenantsController {
    private readonly tenantsService;
    private readonly authService;
    constructor(tenantsService: TenantsService, authService: AuthService);
    create(dto: CreateTenantDto, req: any): Promise<import("./schemas/tenant.schema").Tenant>;
    findAll(): Promise<import("./schemas/tenant.schema").Tenant[]>;
    getMyTenants(req: any): any[] | Promise<import("./schemas/tenant.schema").Tenant[]>;
    findOne(id: string, req: any): Promise<import("./schemas/tenant.schema").Tenant>;
    update(id: string, dto: UpdateTenantDto, req: any): Promise<import("./schemas/tenant.schema").Tenant>;
    remove(id: string): Promise<boolean>;
}
