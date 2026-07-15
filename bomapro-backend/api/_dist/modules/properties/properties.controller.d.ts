import { PropertiesService } from './properties.service';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    create(dto: any, req: any): Promise<import("./schemas/property.schema").Property>;
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string, type?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/property.schema").Property>>;
    getStats(req: any): Promise<{
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
    }>;
    findOne(id: string, req: any): Promise<import("./schemas/property.schema").Property>;
    update(id: string, dto: any, req: any): Promise<import("./schemas/property.schema").Property>;
    remove(id: string, req: any): Promise<boolean>;
}
