import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { deleteOperation } from '../delete.js';
import { deleteByIDOperation } from '../deleteByID.js';
async function deleteLocal(payload, options) {
    const { id, collection: collectionSlug, depth, disableTransaction, overrideAccess = true, overrideLock, populate, select, showHiddenFields, trash = false, where } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`);
    }
    const args = {
        id,
        collection,
        depth,
        disableTransaction,
        overrideAccess,
        overrideLock,
        populate,
        req: await createLocalReq(options, payload),
        select,
        showHiddenFields,
        trash,
        where
    };
    if (options.id) {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        return deleteByIDOperation(args);
    }
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return deleteOperation(args);
}
export { deleteLocal };

//# sourceMappingURL=delete.js.map