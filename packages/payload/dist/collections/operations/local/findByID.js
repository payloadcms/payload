import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { findByIDOperation } from '../findByID.js';
export async function findByIDLocal(payload, options) {
    const { id, collection: collectionSlug, currentDepth, data, depth, disableErrors = false, draft = false, flattenLocales, includeLockStatus, joins, overrideAccess = true, populate, select, showHiddenFields, trash = false } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`);
    }
    return findByIDOperation({
        id,
        collection,
        currentDepth,
        data,
        depth,
        disableErrors,
        draft,
        flattenLocales,
        includeLockStatus,
        joins,
        overrideAccess,
        populate,
        req: await createLocalReq(options, payload),
        select,
        showHiddenFields,
        trash
    });
}

//# sourceMappingURL=findByID.js.map