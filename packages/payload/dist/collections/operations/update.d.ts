import type { DeepPartial } from 'ts-essentials';
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js';
import type { BulkOperationResult, Collection, RequiredDataFromCollectionSlug, SelectFromCollectionSlug } from '../config/types.js';
import { type CollectionSlug } from '../../index.js';
export type Arguments<TSlug extends CollectionSlug> = {
    autosave?: boolean;
    collection: Collection;
    data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    depth?: number;
    disableTransaction?: boolean;
    disableVerificationEmail?: boolean;
    draft?: boolean;
    limit?: number;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    overwriteExistingFiles?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-createdAt' // Sort DESC by createdAt
     * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    trash?: boolean;
    where: Where;
};
export declare const updateOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: Arguments<TSlug>) => Promise<BulkOperationResult<TSlug, TSelect>>;
//# sourceMappingURL=update.d.ts.map