import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { preferencesCollectionSlug } from '../config.js';
export async function update(args) {
    const { key, req: { payload }, req, user, value } = args;
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
    const preference = {
        key,
        user: {
            relationTo: user.collection,
            value: user.id
        },
        value
    };
    return await payload.db.upsert({
        collection: preferencesCollectionSlug,
        data: preference,
        req,
        where
    });
}

//# sourceMappingURL=update.js.map