import { executeAccess } from '../auth/executeAccess.js';
import { hasWhereAccessResult } from '../auth/types.js';
import { combineQueries } from '../database/combineQueries.js';
import { Forbidden } from '../errors/Forbidden.js';
import { NotFound } from '../errors/NotFound.js';
import { afterRead } from '../fields/hooks/afterRead/index.js';
import { beforeDuplicate } from '../fields/hooks/beforeDuplicate/index.js';
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js';
import { filterDataToSelectedLocales } from '../utilities/filterDataToSelectedLocales.js';
import { getLatestCollectionVersion } from '../versions/getLatestCollectionVersion.js';
export const getDuplicateDocumentData = async ({ id, collectionConfig, draftArg, overrideAccess, req, selectedLocales })=>{
    const { payload } = req;
    // /////////////////////////////////////
    // Read Access
    // /////////////////////////////////////
    const accessResults = !overrideAccess ? await executeAccess({
        id,
        req
    }, collectionConfig.access.read) : true;
    const hasWherePolicy = hasWhereAccessResult(accessResults);
    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    const findOneArgs = {
        collection: collectionConfig.slug,
        locale: req.locale,
        req,
        where: combineQueries({
            id: {
                equals: id
            }
        }, accessResults)
    };
    let duplicatedFromDocWithLocales = await getLatestCollectionVersion({
        id,
        config: collectionConfig,
        payload,
        query: findOneArgs,
        req
    });
    if (selectedLocales && selectedLocales.length > 0 && duplicatedFromDocWithLocales) {
        duplicatedFromDocWithLocales = filterDataToSelectedLocales({
            configBlockReferences: payload.config.blocks,
            docWithLocales: duplicatedFromDocWithLocales,
            fields: collectionConfig.fields,
            selectedLocales
        });
    }
    if (!duplicatedFromDocWithLocales && !hasWherePolicy) {
        throw new NotFound(req.t);
    }
    if (!duplicatedFromDocWithLocales && hasWherePolicy) {
        throw new Forbidden(req.t);
    }
    // remove the createdAt timestamp and rely on the db to set it
    if ('createdAt' in duplicatedFromDocWithLocales) {
        delete duplicatedFromDocWithLocales.createdAt;
    }
    // remove the id and rely on the db to set it
    if ('id' in duplicatedFromDocWithLocales) {
        delete duplicatedFromDocWithLocales.id;
    }
    duplicatedFromDocWithLocales = await beforeDuplicate({
        id,
        collection: collectionConfig,
        context: req.context,
        doc: duplicatedFromDocWithLocales,
        overrideAccess: overrideAccess,
        req
    });
    const duplicatedFromDoc = await afterRead({
        collection: collectionConfig,
        context: req.context,
        depth: 0,
        doc: deepCopyObjectSimple(duplicatedFromDocWithLocales),
        draft: draftArg,
        fallbackLocale: null,
        global: null,
        locale: req.locale,
        overrideAccess: true,
        req,
        showHiddenFields: true
    });
    return {
        duplicatedFromDoc,
        duplicatedFromDocWithLocales
    };
};

//# sourceMappingURL=index.js.map