import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Damage } from '../schemas/damage.schema';
export declare class DamageRepository extends BaseRepository<Damage> {
    constructor(model: Model<Damage>);
    findByTenant(tenantId: string): Promise<Damage[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<Damage[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<Damage[]>;
    findByStatus(tenantId: string, status: string): Promise<Damage[]>;
    getTotalCost(tenantId: string): Promise<number>;
    countByTenant(tenantId: string): Promise<number>;
    countByStatus(tenantId: string, status: string): Promise<number>;
    countByProperty(tenantId: string, propertyId: string): Promise<number>;
    countByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number>;
    getTotalCostByProperty(tenantId: string, propertyId: string): Promise<number>;
}
