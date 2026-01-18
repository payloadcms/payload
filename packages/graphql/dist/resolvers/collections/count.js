import { countOperation, isolateObjectProperty } from 'payload';
export function countResolver(collection) {
    return async function resolver(_, args, context) {
        let { req } = context;
        const locale = req.locale;
        const fallbackLocale = req.fallbackLocale;
        req = isolateObjectProperty(req, 'locale');
        req = isolateObjectProperty(req, 'fallbackLocale');
        req.locale = args.locale || locale;
        req.fallbackLocale = fallbackLocale;
        context.req = req;
        const options = {
            collection,
            req: isolateObjectProperty(req, 'transactionID'),
            trash: args.trash,
            where: args.where
        };
        const results = await countOperation(options);
        return results;
    };
}

//# sourceMappingURL=count.js.map