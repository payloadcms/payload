import { Forbidden } from '../../errors/index.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { ensureUsernameOrEmail } from '../ensureUsernameOrEmail.js';
export const registerFirstUserOperation = async (args)=>{
    const { collection: { config, config: { slug, auth: { verify } } }, data, req, req: { payload } } = args;
    if (config.auth.disableLocalStrategy) {
        throw new Forbidden(req.t);
    }
    try {
        const shouldCommit = await initTransaction(req);
        ensureUsernameOrEmail({
            authOptions: config.auth,
            collectionSlug: slug,
            data,
            operation: 'create',
            req
        });
        const where = appendNonTrashedFilter({
            enableTrash: Boolean(config.trash),
            trash: false,
            where: {}
        });
        const doc = await payload.db.findOne({
            collection: config.slug,
            req,
            where
        });
        if (doc) {
            throw new Forbidden(req.t);
        }
        // /////////////////////////////////////
        // Register first user
        // /////////////////////////////////////
        const result = await payload.create({
            collection: slug,
            data,
            overrideAccess: true,
            req
        });
        // auto-verify (if applicable)
        if (verify) {
            await payload.update({
                id: result.id,
                collection: slug,
                data: {
                    _verified: true
                },
                req
            });
        }
        // /////////////////////////////////////
        // Log in new user
        // /////////////////////////////////////
        const { exp, token } = await payload.login({
            ...args,
            collection: slug,
            req
        });
        result.collection = slug;
        result._strategy = 'local-jwt';
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return {
            exp,
            token,
            user: result
        };
    } catch (error) {
        await killTransaction(req);
        throw error;
    }
};

//# sourceMappingURL=registerFirstUser.js.map