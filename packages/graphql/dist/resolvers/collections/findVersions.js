import { findVersionsOperation, isolateObjectProperty } from 'payload';
import { buildSelectForCollectionMany } from '../../utilities/select.js';
export function findVersionsResolver(collection) {
    return async function resolver(_, args, context, info) {
        const req = context.req = isolateObjectProperty(context.req, [
            'locale',
            'fallbackLocale',
            'transactionID'
        ]);
        const select = context.select = args.select ? buildSelectForCollectionMany(info) : undefined;
        req.locale = args.locale || req.locale;
        req.fallbackLocale = args.fallbackLocale || req.fallbackLocale;
        req.query = req.query || {};
        const draft = args.draft ?? req.query?.draft === 'false' ? false : req.query?.draft === 'true' ? true : undefined;
        if (typeof draft === 'boolean') {
            req.query.draft = String(draft);
        }
        const { sort } = args;
        const options = {
            collection,
            depth: 0,
            limit: args.limit,
            page: args.page,
            pagination: args.pagination,
            req,
            select,
            sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
            trash: args.trash,
            where: args.where
        };
        const result = await findVersionsOperation(options);
        return result;
    };
}

//# sourceMappingURL=findVersions.js.map