import { Field, TabAsField } from '../../config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
type Args = {
    data: Record<string, unknown>;
    doc: Record<string, unknown>;
    docWithLocales: Record<string, unknown>;
    errors: {
        message: string;
        field: string;
    }[];
    fields: (Field | TabAsField)[];
    id?: string | number;
    mergeLocaleActions: (() => void)[];
    operation: Operation;
    path: string;
    req: PayloadRequest;
    siblingData: Record<string, unknown>;
    siblingDoc: Record<string, unknown>;
    siblingDocWithLocales: Record<string, unknown>;
    skipValidation?: boolean;
};
export declare const traverseFields: ({ data, doc, docWithLocales, errors, fields, id, mergeLocaleActions, operation, path, req, siblingData, siblingDoc, siblingDocWithLocales, skipValidation, }: Args) => Promise<void>;
export {};
