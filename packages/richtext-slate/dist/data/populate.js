import { createDataloaderCacheKey } from 'payload';
export const populate = async ({ id, collection, currentDepth, data, depth, draft, key, overrideAccess, req, select, showHiddenFields })=>{
    const dataRef = data;
    const doc = await req.payloadDataLoader.load(createDataloaderCacheKey({
        collectionSlug: collection.config.slug,
        currentDepth: currentDepth + 1,
        depth,
        docID: id,
        draft,
        fallbackLocale: req.fallbackLocale,
        locale: req.locale,
        overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
        select,
        showHiddenFields,
        transactionID: req.transactionID
    }));
    if (doc) {
        dataRef[key] = doc;
    } else {
        dataRef[key] = null;
    }
};

//# sourceMappingURL=populate.js.map