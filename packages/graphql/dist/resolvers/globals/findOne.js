import { findOneOperation, isolateObjectProperty } from 'payload';
import { buildSelectForCollection } from '../../utilities/select.js';
export function findOne(globalConfig) {
    return async function resolver(_, args, context, info) {
        const req = context.req = isolateObjectProperty(context.req, [
            'locale',
            'fallbackLocale',
            'transactionID'
        ]);
        const select = context.select = args.select ? buildSelectForCollection(info) : undefined;
        const { slug } = globalConfig;
        req.locale = args.locale || req.locale;
        req.fallbackLocale = args.fallbackLocale || req.fallbackLocale;
        req.query = req.query || {};
        const options = {
            slug,
            depth: 0,
            draft: args.draft,
            globalConfig,
            req,
            select
        };
        const result = await findOneOperation(options);
        return result;
    };
}

//# sourceMappingURL=findOne.js.map