import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Tenant } from '../schemas/tenant.schema';
export declare class TenantRepository extends BaseRepository<Tenant> {
    constructor(model: Model<Tenant>);
    findBySlug(slug: string): Promise<Tenant | null>;
    findByOwner(ownerUserId: string): Promise<Tenant[]>;
    findByIds(ids: string[]): Promise<Tenant[]>;
}
