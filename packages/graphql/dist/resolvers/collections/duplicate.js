import { duplicateOperation, isolateObjectProperty } from 'payload';
export function duplicateResolver(collection) {
    return async function resolver(_, args, context) {
        const { req } = context;
        const locale = req.locale;
        const fallbackLocale = req.fallbackLocale;
        req.locale = args.locale || locale;
        req.fallbackLocale = args.fallbackLocale || fallbackLocale;
        context.req = req;
        const result = await duplicateOperation({
            id: args.id,
            collection,
            data: args.data,
            depth: 0,
            draft: args.draft,
            req: isolateObjectProperty(req, 'transactionID')
        });
        return result;
    };
}

//# sourceMappingURL=duplicate.js.map