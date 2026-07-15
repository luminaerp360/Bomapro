import { FilterQuery } from 'mongoose';
export interface PaginationOptions<T> {
    page?: number;
    limit?: number;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    filter?: FilterQuery<T>;
}
