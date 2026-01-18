import { APIError } from '../errors/APIError.js';
import { createLocalReq } from '../utilities/createLocalReq.js';
import { initTransaction } from '../utilities/initTransaction.js';
import { killTransaction } from '../utilities/killTransaction.js';
import { queryPresetsCollectionSlug } from './config.js';
/**
 * Prevents "accidental lockouts" where a user makes an update that removes their own access to the preset.
 * This is effectively an access control function proxied through a `validate` function.
 * How it works:
 *   1. Creates a temporary record with the incoming data
 *   2. Attempts to read and update that record with the incoming user
 *   3. If either of those fail, throws an error to the user
 *   4. Once finished, prevents the temp record from persisting to the database
 */ export const preventLockout = async (value, { data, overrideAccess, req: incomingReq })=>{
    // Use context to ensure an infinite loop doesn't occur
    if (!incomingReq.context._preventLockout && !overrideAccess) {
        const req = await createLocalReq({
            context: {
                _preventLockout: true
            },
            req: {
                user: incomingReq.user
            }
        }, incomingReq.payload);
        // Might be `null` if no transactions are enabled
        const transaction = await initTransaction(req);
        // create a temp record to validate the constraints, using the req
        const tempPreset = await req.payload.create({
            collection: queryPresetsCollectionSlug,
            data: {
                ...data,
                isTemp: true
            },
            req
        });
        let canUpdate = false;
        let canRead = false;
        try {
            await req.payload.findByID({
                id: tempPreset.id,
                collection: queryPresetsCollectionSlug,
                overrideAccess: false,
                req,
                user: req.user
            });
            canRead = true;
            await req.payload.update({
                id: tempPreset.id,
                collection: queryPresetsCollectionSlug,
                data: tempPreset,
                overrideAccess: false,
                req,
                user: req.user
            });
            canUpdate = true;
        } catch (_err) {
            if (!canRead || !canUpdate) {
                throw new APIError('This action will lock you out of this preset.', 403, {}, true);
            }
        } finally{
            if (transaction) {
                await killTransaction(req);
            } else {
                // delete the temp record
                await req.payload.delete({
                    id: tempPreset.id,
                    collection: queryPresetsCollectionSlug,
                    req
                });
            }
        }
    }
    return true;
};

//# sourceMappingURL=preventLockout.js.map