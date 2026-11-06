import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, BulkImportUnitsDto } from './dto/unit.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    bulkImport(dto: BulkImportUnitsDto, req: any): Promise<{
        success: boolean;
        message: string;
        total: number;
        created: number;
        updated: number;
        skipped: number;
        propertiesAffected: string[];
    }>;
    create(dto: CreateUnitDto, req: any): Promise<import(".").Unit>;
    findAll(req: any, page?: number, limit?: number, propertyId?: string, status?: string, search?: string, unitType?: string, floor?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any, propertyId?: string): Promise<{
        total: number;
        occupied: number;
        vacant: number;
        maintenance: number;
        available: number;
        occupiedRentTotal: number;
        potentialRentTotal: number;
    }>;
    findOne(id: string, req: any): Promise<any>;
    findByProperty(propertyId: string, req: any): Promise<any[]>;
    findAvailable(propertyId: string, req: any): Promise<import(".").Unit[]>;
    update(id: string, dto: UpdateUnitDto, req: any): Promise<import(".").Unit>;
    remove(id: string, req: any): Promise<boolean>;
}
