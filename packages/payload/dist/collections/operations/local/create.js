import { APIError } from '../../../errors/index.js';
import { deepCopyObjectSimple } from '../../../index.js';
import { getFileByPath } from '../../../uploads/getFileByPath.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { createOperation } from '../create.js';
export async function createLocal(payload, options) {
    const { collection: collectionSlug, data, depth, disableTransaction, disableVerificationEmail, draft, duplicateFromID, file, filePath, overrideAccess = true, overwriteExistingFiles = false, populate, select, showHiddenFields } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Create Operation.`);
    }
    const req = await createLocalReq(options, payload);
    req.file = file ?? await getFileByPath(filePath);
    return createOperation({
        collection,
        data: deepCopyObjectSimple(data),
        depth,
        disableTransaction,
        disableVerificationEmail,
        draft,
        duplicateFromID,
        overrideAccess,
        overwriteExistingFiles,
        populate,
        req,
        select,
        showHiddenFields
    });
}

//# sourceMappingURL=create.js.map