import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Lease } from '../schemas/lease.schema';
export declare class LeaseRepository extends BaseRepository<Lease> {
    constructor(model: Model<Lease>);
    findByTenant(tenantId: string): Promise<Lease[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<Lease[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<Lease[]>;
    findByUnit(tenantId: string, unitId: string): Promise<Lease[]>;
    findActiveByUnit(unitId: string, tenantId: string): Promise<Lease | null>;
    findActiveByProperty(propertyId: string): Promise<Lease | null>;
    findExpiringSoon(tenantId: string, daysAhead: number): Promise<Lease[]>;
    countByStatus(tenantId: string, status: string): Promise<number>;
    countByTenant(tenantId: string): Promise<number>;
    countByProperty(tenantId: string, propertyId: string): Promise<number>;
    countByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number>;
    findExpiringSoonByProperty(tenantId: string, propertyId: string, daysAhead: number): Promise<Lease[]>;
}
