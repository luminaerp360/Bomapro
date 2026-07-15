import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Property } from '../schemas/property.schema';
export declare class PropertyRepository extends BaseRepository<Property> {
    constructor(model: Model<Property>);
    findByTenant(tenantId: string): Promise<Property[]>;
    findByStatus(tenantId: string, status: string): Promise<Property[]>;
    findByManager(tenantId: string, managerId: string): Promise<Property[]>;
    countByTenant(tenantId: string): Promise<number>;
    countByStatus(tenantId: string, status: string): Promise<number>;
}
