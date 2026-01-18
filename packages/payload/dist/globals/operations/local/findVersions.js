import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { findVersionsOperation } from '../findVersions.js';
export async function findGlobalVersionsLocal(payload, options) {
    const { slug: globalSlug, depth, limit, overrideAccess = true, page, pagination = true, populate, select, showHiddenFields, sort, where } = options;
    const globalConfig = payload.globals.config.find((config)=>config.slug === globalSlug);
    if (!globalConfig) {
        throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
    }
    return findVersionsOperation({
        depth,
        globalConfig,
        limit,
        overrideAccess,
        page,
        pagination,
        populate,
        req: await createLocalReq(options, payload),
        select,
        showHiddenFields,
        sort,
        where
    });
}

//# sourceMappingURL=findVersions.js.map