import { isolateObjectProperty, verifyEmailOperation } from 'payload';
export function verifyEmail(collection) {
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
            req: isolateObjectProperty(context.req, 'transactionID'),
            token: args.token
        };
        const success = await verifyEmailOperation(options);
        return success;
    }
    return resolver;
}

//# sourceMappingURL=verifyEmail.js.map