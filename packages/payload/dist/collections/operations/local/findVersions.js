import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { findVersionsOperation } from '../findVersions.js';
export async function findVersionsLocal(payload, options) {
    const { collection: collectionSlug, depth, limit, overrideAccess = true, page, pagination = true, populate, select, showHiddenFields, sort, trash = false, where } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Find Versions Operation.`);
    }
    return findVersionsOperation({
        collection,
        depth,
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

//# sourceMappingURL=findVersions.js.map