import { isolateObjectProperty, updateByIDOperation } from 'payload';
export function updateResolver(collection) {
    return async function resolver(_, args, context) {
        let { req } = context;
        const locale = req.locale;
        const fallbackLocale = req.fallbackLocale;
        req = isolateObjectProperty(req, 'locale');
        req = isolateObjectProperty(req, 'fallbackLocale');
        req.locale = args.locale || locale;
        req.fallbackLocale = args.fallbackLocale || fallbackLocale;
        if (!req.query) {
            req.query = {};
        }
        const draft = args.draft ?? req.query?.draft === 'false' ? false : req.query?.draft === 'true' ? true : undefined;
        if (typeof draft === 'boolean') {
            req.query.draft = String(draft);
        }
        context.req = req;
        const options = {
            id: args.id,
            autosave: args.autosave,
            collection,
            data: args.data,
            depth: 0,
            draft: args.draft,
            req: isolateObjectProperty(req, 'transactionID'),
            trash: args.trash
        };
        const result = await updateByIDOperation(options);
        return result;
    };
}

//# sourceMappingURL=update.js.map