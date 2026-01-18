import { decodeJwt } from 'jose';
export const meOperation = async (args)=>{
    const { collection, currentToken, depth, draft, joins, populate, req, select } = args;
    let result = {
        user: null
    };
    if (req.user) {
        const { pathname } = req;
        const isGraphQL = pathname === `/api${req.payload.config.routes.graphQL}`;
        const user = await req.payload.findByID({
            id: req.user.id,
            collection: collection.config.slug,
            depth: isGraphQL ? 0 : depth ?? collection.config.auth.depth,
            draft,
            joins,
            overrideAccess: false,
            populate,
            req,
            select,
            showHiddenFields: false
        });
        if (user) {
            user.collection = collection.config.slug;
            user._strategy = req.user._strategy;
        }
        if (req.user.collection !== collection.config.slug) {
            return {
                user: null
            };
        }
        // /////////////////////////////////////
        // me hook - Collection
        // /////////////////////////////////////
        for (const meHook of collection.config.hooks.me){
            const hookResult = await meHook({
                args,
                user
            });
            if (hookResult) {
                result.user = hookResult.user;
                result.exp = hookResult.exp;
                break;
            }
        }
        result.collection = req.user.collection;
        /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */ result.strategy = req.user._strategy;
        if (!result.user) {
            result.user = user;
            if (currentToken) {
                const decoded = decodeJwt(currentToken);
                if (decoded) {
                    result.exp = decoded.exp;
                }
                if (!collection.config.auth.removeTokenFromResponses) {
                    result.token = currentToken;
                }
            }
        }
    }
    // /////////////////////////////////////
    // After Me - Collection
    // /////////////////////////////////////
    if (collection.config.hooks?.afterMe?.length) {
        for (const hook of collection.config.hooks.afterMe){
            result = await hook({
                collection: collection?.config,
                context: req.context,
                req,
                response: result
            }) || result;
        }
    }
    return result;
};

//# sourceMappingURL=me.js.map