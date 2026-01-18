import { findVersionByIDOperationGlobal, isolateObjectProperty } from 'payload';
import { buildSelectForCollection } from '../../utilities/select.js';
export function findVersionByID(globalConfig) {
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
        const options = {
            id: args.id,
            depth: 0,
            draft: args.draft,
            globalConfig,
            req,
            select
        };
        const result = await findVersionByIDOperationGlobal(options);
        return result;
    };
}

//# sourceMappingURL=findVersionByID.js.map