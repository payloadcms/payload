import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { RequestContext } from '../../../index.js';
import type { JsonObject, PayloadRequest } from '../../../types/index.js';
import type { Field, TabAsField } from '../../config/types.js';
type Args<T> = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    doc: T;
    fields: (Field | TabAsField)[];
    id?: number | string;
    overrideAccess: boolean;
    parentIndexPath: string;
    parentIsLocalized: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingDoc: JsonObject;
};
export declare const traverseFields: <T>({ id, blockData, collection, context, doc, fields, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingDoc, }: Args<T>) => Promise<void>;
export {};
//# sourceMappingURL=traverseFields.d.ts.map