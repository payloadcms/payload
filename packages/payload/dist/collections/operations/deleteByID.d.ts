import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest, PopulateType, SelectType, TransformCollectionWithSelect } from '../../types/index.js';
import type { Collection } from '../config/types.js';
export type Arguments = {
    collection: Collection;
    depth?: number;
    disableTransaction?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
export declare const deleteByIDOperation: <TSlug extends CollectionSlug, TSelect extends SelectType>(incomingArgs: Arguments) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
//# sourceMappingURL=deleteByID.d.ts.map