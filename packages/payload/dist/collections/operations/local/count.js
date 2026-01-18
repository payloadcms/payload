import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { countOperation } from '../count.js';
export async function countLocal(payload, options) {
    const { collection: collectionSlug, disableErrors, overrideAccess = true, trash = false, where } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Count Operation.`);
    }
    return countOperation({
        collection,
        disableErrors,
        overrideAccess,
        req: await createLocalReq(options, payload),
        trash,
        where
    });
}

//# sourceMappingURL=count.js.map