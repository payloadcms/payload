import { findByIDOperation, isolateObjectProperty } from 'payload';
import { buildSelectForCollection } from '../../utilities/select.js';
export function findByIDResolver(collection) {
    return async function resolver(_, args, context, info) {
        const req = context.req = isolateObjectProperty(context.req, [
            'locale',
            'fallbackLocale',
            'transactionID'
        ]);
        const select = context.select = args.select ? buildSelectForCollection(info) : undefined;
        req.locale = args.locale || req.locale;
        req.fallbackLocale = args.fallbackLocale || req.fallbackLocale;
        req.query = req.query || {};
        const draft = args.draft ?? req.query?.draft === 'false' ? false : req.query?.draft === 'true' ? true : undefined;
        if (typeof draft === 'boolean') {
            req.query.draft = String(draft);
        }
        const options = {
            id: args.id,
            collection,
            depth: 0,
            draft: args.draft,
            req,
            select,
            trash: args.trash
        };
        const result = await findByIDOperation(options);
        return result;
    };
}

//# sourceMappingURL=findByID.js.map