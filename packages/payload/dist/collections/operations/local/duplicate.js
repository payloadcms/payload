import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { duplicateOperation } from '../duplicate.js';
export async function duplicateLocal(payload, options) {
    const { id, collection: collectionSlug, data, depth, disableTransaction, draft, overrideAccess = true, populate, select, selectedLocales, showHiddenFields } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Duplicate Operation.`);
    }
    if (collection.config.disableDuplicate === true) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} cannot be duplicated.`, 400);
    }
    const req = await createLocalReq(options, payload);
    return duplicateOperation({
        id,
        collection,
        data,
        depth,
        disableTransaction,
        draft,
        overrideAccess,
        populate,
        req,
        select,
        selectedLocales,
        showHiddenFields
    });
}

//# sourceMappingURL=duplicate.js.map