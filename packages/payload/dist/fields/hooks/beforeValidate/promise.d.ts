import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
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
    data: T;
    /**
     * The original data (not modified by any hooks)
     */
    doc: T;
    field: Field | TabAsField;
    fieldIndex: number;
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    operation: 'create' | 'update';
    overrideAccess: boolean;
    parentIndexPath: string;
    parentIsLocalized: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingData: JsonObject;
    /**
     * The original siblingData (not modified by any hooks)
     */
    siblingDoc: JsonObject;
    siblingFields?: (Field | TabAsField)[];
};
export declare const promise: <T>({ id, blockData, collection, context, data, doc, field, fieldIndex, global, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc, siblingFields, }: Args<T>) => Promise<void>;
export {};
//# sourceMappingURL=promise.d.ts.map