import { APIError } from '../../../errors/index.js';
import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { findOneOperation } from '../findOne.js';
export async function findOneGlobalLocal(payload, options) {
    const { slug: globalSlug, data, depth, draft = false, flattenLocales, includeLockStatus, overrideAccess = true, populate, select, showHiddenFields } = options;
    const globalConfig = payload.globals.config.find((config)=>config.slug === globalSlug);
    if (!globalConfig) {
        throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`);
    }
    return findOneOperation({
        slug: globalSlug,
        data,
        depth,
        draft,
        flattenLocales,
        globalConfig,
        includeLockStatus,
        overrideAccess,
        populate,
        req: await createLocalReq(options, payload),
        select,
        showHiddenFields
    });
}

//# sourceMappingURL=findOne.js.map