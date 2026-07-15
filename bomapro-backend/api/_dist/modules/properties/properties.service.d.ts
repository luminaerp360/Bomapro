import { PropertyRepository } from './repositories/property.repository';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
export declare class PropertiesService {
    private readonly propertyRepository;
    constructor(propertyRepository: PropertyRepository);
    private generatePropertyCode;
    create(dto: CreatePropertyDto, tenantId: string): Promise<import("./schemas/property.schema").Property>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, status?: string, type?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/property.schema").Property>>;
    findById(id: string, tenantId: string): Promise<import("./schemas/property.schema").Property>;
    update(id: string, tenantId: string, dto: UpdatePropertyDto): Promise<import("./schemas/property.schema").Property>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
    }>;
}
