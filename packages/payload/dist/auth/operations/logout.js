import { status as httpStatus } from 'http-status';
import { APIError } from '../../errors/index.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
export const logoutOperation = async (incomingArgs)=>{
    let args = incomingArgs;
    const { allSessions, collection: { config: collectionConfig }, req: { user }, req } = incomingArgs;
    if (!user) {
        throw new APIError('No User', httpStatus.BAD_REQUEST);
    }
    if (user.collection !== collectionConfig.slug) {
        throw new APIError('Incorrect collection', httpStatus.FORBIDDEN);
    }
    const shouldCommit = await initTransaction(req);
    try {
        if (collectionConfig.hooks?.afterLogout?.length) {
            for (const hook of collectionConfig.hooks.afterLogout){
                args = await hook({
                    collection: args.collection?.config,
                    context: req.context,
                    req
                }) || args;
            }
        }
        if (collectionConfig.auth.disableLocalStrategy !== true && collectionConfig.auth.useSessions) {
            const where = appendNonTrashedFilter({
                enableTrash: Boolean(collectionConfig.trash),
                trash: false,
                where: {
                    id: {
                        equals: user.id
                    }
                }
            });
            const userWithSessions = await req.payload.db.findOne({
                collection: collectionConfig.slug,
                req,
                where
            });
            if (!userWithSessions) {
                throw new APIError('No User', httpStatus.BAD_REQUEST);
            }
            if (allSessions) {
                userWithSessions.sessions = [];
            } else {
                const sessionsAfterLogout = (userWithSessions?.sessions || []).filter((s)=>s.id !== req?.user?._sid);
                userWithSessions.sessions = sessionsAfterLogout;
            }
            // Prevent updatedAt from being updated when only removing a session
            ;
            userWithSessions.updatedAt = null;
            await req.payload.db.updateOne({
                id: user.id,
                collection: collectionConfig.slug,
                data: userWithSessions,
                req,
                returning: false
            });
        }
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return true;
    } catch (error) {
        await killTransaction(req);
        throw error;
    }
};

//# sourceMappingURL=logout.js.map