import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { countVersionsOperation } from '../countVersions.js';
export async function countVersionsLocal(payload, options) {
    const { collection: collectionSlug, disableErrors, overrideAccess = true, where } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Count Versions Operation.`);
    }
    return countVersionsOperation({
        collection,
        disableErrors,
        overrideAccess,
        req: await createLocalReq(options, payload),
        where
    });
}

//# sourceMappingURL=countVersions.js.map