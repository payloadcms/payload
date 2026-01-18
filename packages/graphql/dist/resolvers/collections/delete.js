import { deleteByIDOperation, isolateObjectProperty } from 'payload';
export function getDeleteResolver(collection) {
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
            collection,
            depth: 0,
            req: isolateObjectProperty(req, 'transactionID'),
            trash: args.trash
        };
        const result = await deleteByIDOperation(options);
        return result;
    };
}

//# sourceMappingURL=delete.js.map