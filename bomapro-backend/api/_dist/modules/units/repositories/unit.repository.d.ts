import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Unit } from '../schemas/unit.schema';
export declare class UnitRepository extends BaseRepository<Unit> {
    constructor(model: Model<Unit>);
    findByProperty(propertyId: string, tenantId: string): Promise<Unit[]>;
    findByPropertyId(propertyId: string): Promise<Unit[]>;
    findByTenant(tenantId: string): Promise<Unit[]>;
    findByStatus(tenantId: string, status: string): Promise<Unit[]>;
    findOccupied(tenantId: string): Promise<Unit[]>;
    findAvailable(propertyId: string, tenantId: string): Promise<Unit[]>;
    findByPropertyTenant(propertyTenantId: string, tenantId: string): Promise<Unit | null>;
    countByTenant(tenantId: string): Promise<number>;
    countByStatus(tenantId: string, status: string): Promise<number>;
    countByProperty(propertyId: string, tenantId: string): Promise<number>;
    countOccupied(tenantId: string): Promise<number>;
    countAvailable(tenantId: string): Promise<number>;
}
