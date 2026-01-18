import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { findOperation } from '../find.js';
export async function findLocal(payload, options) {
    const { collection: collectionSlug, currentDepth, depth, disableErrors, draft = false, includeLockStatus, joins, limit, overrideAccess = true, page, pagination = true, populate, select, showHiddenFields, sort, trash = false, where } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`);
    }
    return findOperation({
        collection,
        currentDepth,
        depth,
        disableErrors,
        draft,
        includeLockStatus,
        joins,
        limit,
        overrideAccess,
        page,
        pagination,
        populate,
        req: await createLocalReq(options, payload),
        select,
        showHiddenFields,
        sort,
        trash,
        where
    });
}

//# sourceMappingURL=find.js.map