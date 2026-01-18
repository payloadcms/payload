import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../types/index.js';
import type { Collection, TypeWithID } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    disableTransaction?: boolean;
    draft?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
};
export declare const restoreVersionOperation: <TData extends JsonObject & TypeWithID = JsonObject & TypeWithID>(args: Arguments) => Promise<TData>;
//# sourceMappingURL=restoreVersion.d.ts.map