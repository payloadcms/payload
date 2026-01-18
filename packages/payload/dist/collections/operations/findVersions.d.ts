import type { PaginatedDocs } from '../../database/types.js';
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js';
import type { TypeWithVersion } from '../../versions/types.js';
import type { Collection } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    depth?: number;
    limit?: number;
    overrideAccess?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    sort?: Sort;
    trash?: boolean;
    where?: Where;
};
export declare const findVersionsOperation: <TData extends TypeWithVersion<TData>>(args: Arguments) => Promise<PaginatedDocs<TData>>;
//# sourceMappingURL=findVersions.d.ts.map