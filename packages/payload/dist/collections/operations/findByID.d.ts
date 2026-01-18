import type { CollectionSlug, JoinQuery } from '../../index.js';
import type { ApplyDisableErrors, JsonObject, PayloadRequest, PopulateType, SelectType, TransformCollectionWithSelect } from '../../types/index.js';
import type { Collection, SelectFromCollectionSlug } from '../config/types.js';
import { type AfterReadArgs } from '../../fields/hooks/afterRead/index.js';
export type FindByIDArgs = {
    collection: Collection;
    currentDepth?: number;
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    depth?: number;
    disableErrors?: boolean;
    draft?: boolean;
    id: number | string;
    includeLockStatus?: boolean;
    joins?: JoinQuery;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>;
export declare const findByIDOperation: <TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect extends SelectFromCollectionSlug<TSlug>>(incomingArgs: FindByIDArgs) => Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>>;
//# sourceMappingURL=findByID.d.ts.map