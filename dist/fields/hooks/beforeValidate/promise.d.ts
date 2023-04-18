import { PayloadRequest } from '../../../express/types';
import { Field, TabAsField } from '../../config/types';
type Args<T> = {
    data: T;
    doc: T;
    field: Field | TabAsField;
    id?: string | number;
    operation: 'create' | 'update';
    overrideAccess: boolean;
    req: PayloadRequest;
    siblingData: Record<string, unknown>;
    siblingDoc: Record<string, unknown>;
};
export declare const promise: <T>({ data, doc, field, id, operation, overrideAccess, req, siblingData, siblingDoc, }: Args<T>) => Promise<void>;
export {};
