import type { PaginatedDocs } from '../../database/types.js';
import type { CollectionSlug, JoinQuery } from '../../index.js';
import type { PayloadRequest, PopulateType, SelectType, Sort, TransformCollectionWithSelect, Where } from '../../types/index.js';
import type { Collection, SelectFromCollectionSlug } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    draft?: boolean;
    includeLockStatus?: boolean;
    joins?: JoinQuery;
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
export declare const findOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments) => Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>>;
//# sourceMappingURL=find.d.ts.map