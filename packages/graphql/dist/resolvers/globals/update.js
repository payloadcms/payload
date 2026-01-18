import { isolateObjectProperty, updateOperationGlobal } from 'payload';
export function update(globalConfig) {
    return async function resolver(_, args, context) {
        if (args.locale) {
            context.req.locale = args.locale;
        }
        if (args.fallbackLocale) {
            context.req.fallbackLocale = args.fallbackLocale;
        }
        const { slug } = globalConfig;
        const options = {
            slug,
            data: args.data,
            depth: 0,
            draft: args.draft,
            globalConfig,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await updateOperationGlobal(options);
        return result;
    };
}

//# sourceMappingURL=update.js.map