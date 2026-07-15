import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { PropertyTenant } from '../schemas/property-tenant.schema';
export declare class PropertyTenantRepository extends BaseRepository<PropertyTenant> {
    constructor(model: Model<PropertyTenant>);
    findBySystemTenant(tenantId: string): Promise<PropertyTenant[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<PropertyTenant[]>;
    findByEmail(tenantId: string, email: string): Promise<PropertyTenant | null>;
    countBySystemTenant(tenantId: string): Promise<number>;
    countActive(tenantId: string): Promise<number>;
    countByProperty(tenantId: string, propertyId: string): Promise<number>;
    countActiveByProperty(tenantId: string, propertyId: string): Promise<number>;
}
