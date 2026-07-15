import { Document } from 'mongoose';
export declare class BaseDocument extends Document {
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}
