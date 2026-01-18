import { parseParams } from './parseParams.js';
export const buildQuery = async ({ adapter, collectionSlug, fields, globalSlug, locale, where })=>{
    const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        parentIsLocalized: false,
        payload: adapter.payload,
        where
    });
    return result;
};

//# sourceMappingURL=buildQuery.js.map