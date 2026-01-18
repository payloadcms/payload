import { generatePayloadCookie, isolateObjectProperty, refreshOperation } from 'payload';
export function refresh(collection) {
    async function resolver(_, __, context) {
        const options = {
            collection,
            depth: 0,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await refreshOperation(options);
        const cookie = generatePayloadCookie({
            collectionAuthConfig: collection.config.auth,
            cookiePrefix: context.req.payload.config.cookiePrefix,
            token: result.refreshedToken
        });
        context.headers['Set-Cookie'] = cookie;
        if (collection.config.auth.removeTokenFromResponses) {
            delete result.refreshedToken;
        }
        return result;
    }
    return resolver;
}

//# sourceMappingURL=refresh.js.map