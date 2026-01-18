import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js';
import type { TypeWithVersion } from '../../versions/types.js';
import type { Collection, TypeWithID } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
export declare const findVersionByIDOperation: <TData extends TypeWithID = any>(args: Arguments) => Promise<TypeWithVersion<TData>>;
//# sourceMappingURL=findVersionByID.d.ts.map