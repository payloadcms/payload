import { PayloadRequest } from '../../../express/types';
import { Field, TabAsField } from '../../config/types';
type Args<T> = {
    data: T;
    doc: T;
    fields: (Field | TabAsField)[];
    id?: string | number;
    operation: 'create' | 'update';
    overrideAccess: boolean;
    req: PayloadRequest;
    siblingData: Record<string, unknown>;
    siblingDoc: Record<string, unknown>;
};
export declare const traverseFields: <T>({ data, doc, fields, id, operation, overrideAccess, req, siblingData, siblingDoc, }: Args<T>) => Promise<void>;
export {};
