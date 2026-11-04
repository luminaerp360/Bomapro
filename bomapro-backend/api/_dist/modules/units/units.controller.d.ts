import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    create(dto: CreateUnitDto, req: any): Promise<import(".").Unit>;
    findAll(req: any, page?: number, limit?: number, propertyId?: string, status?: string, search?: string, unitType?: string, floor?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import(".").Unit>>;
    getStats(req: any): Promise<{
        total: number;
        occupied: number;
        available: number;
    }>;
    findOne(id: string, req: any): Promise<import(".").Unit>;
    findByProperty(propertyId: string, req: any): Promise<import(".").Unit[]>;
    findAvailable(propertyId: string, req: any): Promise<import(".").Unit[]>;
    update(id: string, dto: UpdateUnitDto, req: any): Promise<import(".").Unit>;
    remove(id: string, req: any): Promise<boolean>;
}
