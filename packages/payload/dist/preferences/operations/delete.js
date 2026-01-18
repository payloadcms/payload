import { NotFound } from '../../errors/NotFound.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { preferencesCollectionSlug } from '../config.js';
export async function deleteOperation(args) {
    const { key, req: { payload }, req, user } = args;
    if (!user) {
        throw new UnauthorizedError(req.t);
    }
    const where = {
        and: [
            {
                key: {
                    equals: key
                }
            },
            {
                'user.value': {
                    equals: user.id
                }
            },
            {
                'user.relationTo': {
                    equals: user.collection
                }
            }
        ]
    };
    const result = await payload.db.deleteOne({
        collection: preferencesCollectionSlug,
        req,
        where
    });
    if (result) {
        return result;
    }
    throw new NotFound(req.t);
}

//# sourceMappingURL=delete.js.map