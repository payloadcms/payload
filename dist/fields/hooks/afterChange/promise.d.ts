import { PayloadRequest } from '../../../express/types';
import { Field, TabAsField } from '../../config/types';
type Args = {
    data: Record<string, unknown>;
    doc: Record<string, unknown>;
    previousDoc: Record<string, unknown>;
    previousSiblingDoc: Record<string, unknown>;
    field: Field | TabAsField;
    operation: 'create' | 'update';
    req: PayloadRequest;
    siblingData: Record<string, unknown>;
    siblingDoc: Record<string, unknown>;
};
export declare const promise: ({ data, doc, previousDoc, previousSiblingDoc, field, operation, req, siblingData, siblingDoc, }: Args) => Promise<void>;
export {};
