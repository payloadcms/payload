import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { resetPasswordOperation } from '../resetPassword.js';
export async function resetPasswordLocal(payload, options) {
    const { collection: collectionSlug, data, overrideAccess } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Reset Password Operation.`);
    }
    const result = await resetPasswordOperation({
        collection,
        data,
        overrideAccess,
        req: await createLocalReq(options, payload)
    });
    if (collection.config.auth.removeTokenFromResponses) {
        delete result.token;
    }
    return result;
}

//# sourceMappingURL=resetPassword.js.map