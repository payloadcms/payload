import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { verifyEmailOperation } from '../verifyEmail.js';
export async function verifyEmailLocal(payload, options) {
    const { collection: collectionSlug, token } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`);
    }
    return verifyEmailOperation({
        collection,
        req: await createLocalReq(options, payload),
        token
    });
}

//# sourceMappingURL=verifyEmail.js.map