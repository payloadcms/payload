import { findVersionsOperationGlobal, isolateObjectProperty } from 'payload';
import { buildSelectForCollectionMany } from '../../utilities/select.js';
export function findVersions(globalConfig) {
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
        const { sort } = args;
        const options = {
            depth: 0,
            globalConfig,
            limit: args.limit,
            page: args.page,
            pagination: args.pagination,
            req,
            select,
            sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
            where: args.where
        };
        const result = await findVersionsOperationGlobal(options);
        return result;
    };
}

//# sourceMappingURL=findVersions.js.map