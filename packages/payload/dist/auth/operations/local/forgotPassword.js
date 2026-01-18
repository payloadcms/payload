import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { forgotPasswordOperation } from '../forgotPassword.js';
export async function forgotPasswordLocal(payload, options) {
    const { collection: collectionSlug, data, disableEmail, expiration } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Forgot Password Operation.`);
    }
    return forgotPasswordOperation({
        collection,
        data,
        disableEmail,
        expiration,
        req: await createLocalReq(options, payload)
    });
}

//# sourceMappingURL=forgotPassword.js.map