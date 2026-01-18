import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest, PopulateType, SelectType, Where } from '../../types/index.js';
import type { BulkOperationResult, Collection, SelectFromCollectionSlug } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    depth?: number;
    disableTransaction?: boolean;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
    where: Where;
};
export declare const deleteOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments) => Promise<BulkOperationResult<TSlug, TSelect>>;
//# sourceMappingURL=delete.d.ts.map