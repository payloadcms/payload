import { generateExpiredPayloadCookie, isolateObjectProperty, logoutOperation } from 'payload';
export function logout(collection) {
    async function resolver(_, args, context) {
        const options = {
            allSessions: args.allSessions,
            collection,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await logoutOperation(options);
        const expiredCookie = generateExpiredPayloadCookie({
            collectionAuthConfig: collection.config.auth,
            config: context.req.payload.config,
            cookiePrefix: context.req.payload.config.cookiePrefix
        });
        context.headers['Set-Cookie'] = expiredCookie;
        return result;
    }
    return resolver;
}

//# sourceMappingURL=logout.js.map