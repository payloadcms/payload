import { generatePayloadCookie, isolateObjectProperty, resetPasswordOperation } from 'payload';
export function resetPassword(collection) {
    async function resolver(_, args, context) {
        if (args.locale) {
            context.req.locale = args.locale;
        }
        if (args.fallbackLocale) {
            context.req.fallbackLocale = args.fallbackLocale;
        }
        const options = {
            api: 'GraphQL',
            collection,
            data: args,
            depth: 0,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await resetPasswordOperation(options);
        const cookie = generatePayloadCookie({
            collectionAuthConfig: collection.config.auth,
            cookiePrefix: context.req.payload.config.cookiePrefix,
            token: result.token
        });
        context.headers['Set-Cookie'] = cookie;
        if (collection.config.auth.removeTokenFromResponses) {
            delete result.token;
        }
        return result;
    }
    return resolver;
}

//# sourceMappingURL=resetPassword.js.map