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
    field: Field | TabAsField;
    fieldIndex: number;
    id?: number | string;
    overrideAccess: boolean;
    parentIndexPath: string;
    parentIsLocalized: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingDoc: JsonObject;
    siblingFields?: (Field | TabAsField)[];
};
export declare const promise: <T>({ id, blockData, collection, context, doc, field, fieldIndex, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingDoc, siblingFields, }: Args<T>) => Promise<void>;
export {};
//# sourceMappingURL=promise.d.ts.map