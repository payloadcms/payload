import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { ValidationFieldError } from '../../../errors/index.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js';
import type { Field, TabAsField } from '../../config/types.js';
import { type RequestContext } from '../../../index.js';
type Args = {
    /**
     * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
     */
    blockData?: JsonObject;
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: JsonObject;
    doc: JsonObject;
    docWithLocales: JsonObject;
    errors: ValidationFieldError[];
    field: Field | TabAsField;
    fieldIndex: number;
    /**
     * Built up labels of parent fields
     *
     * @example "Group Field > Tab Field > Text Field"
     */
    fieldLabelPath: string;
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    mergeLocaleActions: (() => Promise<void> | void)[];
    operation: Operation;
    overrideAccess: boolean;
    parentIndexPath: string;
    parentIsLocalized: boolean;
    parentPath: string;
    parentSchemaPath: string;
    req: PayloadRequest;
    siblingData: JsonObject;
    siblingDoc: JsonObject;
    siblingDocWithLocales?: JsonObject;
    siblingFields?: (Field | TabAsField)[];
    skipValidation: boolean;
};
export declare const promise: ({ id, blockData, collection, context, data, doc, docWithLocales, errors, field, fieldIndex, fieldLabelPath, global, mergeLocaleActions, operation, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, req, siblingData, siblingDoc, siblingDocWithLocales, siblingFields, skipValidation, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=promise.d.ts.map