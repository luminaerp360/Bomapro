import { Document, Model } from 'mongoose';
import { BaseRepositoryInterface } from '../interfaces/base-repository.interface';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationOptions } from '../interfaces/pagination-options.interface';
export declare abstract class BaseRepository<T extends Document> implements BaseRepositoryInterface<T> {
    protected readonly model: Model<T>;
    constructor(model: Model<T>);
    create(data: Partial<T>): Promise<T>;
    findById(id: string): Promise<T>;
    findAll(): Promise<T[]>;
    findOne(filter: any): Promise<T | null>;
    findBy(filter: any): Promise<T[]>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<boolean>;
    findPaginated(options?: PaginationOptions<T>): Promise<PaginatedResponse<T>>;
}
