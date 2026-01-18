import { executeAccess } from '../../auth/executeAccess.js';
import { combineQueries } from '../../database/combineQueries.js';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js';
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js';
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js';
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js';
import { buildAfterOperation } from './utilities/buildAfterOperation.js';
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js';
export const findVersionsOperation = async (args)=>{
    try {
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'findVersions'
        });
        const { collection: { config: collectionConfig }, depth, limit, overrideAccess, page, pagination = true, populate, select: incomingSelect, showHiddenFields, sort, trash = false, where } = args;
        const req = args.req;
        const { fallbackLocale, locale, payload } = req;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        let accessResults;
        if (!overrideAccess) {
            accessResults = await executeAccess({
                req
            }, collectionConfig.access.readVersions);
        }
        const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true);
        await validateQueryPaths({
            collectionConfig,
            overrideAccess: overrideAccess,
            req,
            versionFields,
            where: where
        });
        let fullWhere = combineQueries(where, accessResults);
        // Exclude trashed documents when trash: false
        fullWhere = appendNonTrashedFilter({
            deletedAtPath: 'version.deletedAt',
            enableTrash: collectionConfig.trash,
            trash,
            where: fullWhere
        });
        sanitizeWhereQuery({
            fields: versionFields,
            payload,
            where: fullWhere
        });
        const select = sanitizeSelect({
            fields: versionFields,
            forceSelect: getQueryDraftsSelect({
                select: collectionConfig.forceSelect
            }),
            select: incomingSelect,
            versions: true
        });
        // /////////////////////////////////////
        // Find
        // /////////////////////////////////////
        const usePagination = pagination && limit !== 0;
        const sanitizedLimit = limit ?? (usePagination ? 10 : 0);
        const sanitizedPage = page || 1;
        const paginatedDocs = await payload.db.findVersions({
            collection: collectionConfig.slug,
            limit: sanitizedLimit,
            locale: locale,
            page: sanitizedPage,
            pagination,
            req,
            select,
            sort,
            where: fullWhere
        });
        // /////////////////////////////////////
        // beforeRead - Collection
        // /////////////////////////////////////
        let result = paginatedDocs;
        result.docs = await Promise.all(paginatedDocs.docs.map(async (doc)=>{
            const docRef = doc;
            // Fallback if not selected
            if (!docRef.version) {
                ;
                docRef.version = {};
            }
            if (collectionConfig.hooks?.beforeRead?.length) {
                for (const hook of collectionConfig.hooks.beforeRead){
                    docRef.version = await hook({
                        collection: collectionConfig,
                        context: req.context,
                        doc: docRef.version,
                        query: fullWhere,
                        req
                    }) || docRef.version;
                }
            }
            return docRef;
        }));
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result.docs = await Promise.all(result.docs.map(async (data)=>{
            data.version = await afterRead({
                collection: collectionConfig,
                context: req.context,
                depth: depth,
                doc: data.version,
                // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
                draft: undefined,
                fallbackLocale: fallbackLocale,
                findMany: true,
                global: null,
                locale: locale,
                overrideAccess: overrideAccess,
                populate,
                req,
                select: typeof select?.version === 'object' ? select.version : undefined,
                showHiddenFields: showHiddenFields
            });
            return data;
        }));
        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////
        if (collectionConfig.hooks.afterRead?.length) {
            result.docs = await Promise.all(result.docs.map(async (doc)=>{
                const docRef = doc;
                for (const hook of collectionConfig.hooks.afterRead){
                    docRef.version = await hook({
                        collection: collectionConfig,
                        context: req.context,
                        doc: doc.version,
                        findMany: true,
                        query: fullWhere,
                        req
                    }) || doc.version;
                }
                return docRef;
            }));
        }
        // /////////////////////////////////////
        // Return results
        // /////////////////////////////////////
        result.docs = result.docs.map((doc)=>sanitizeInternalFields(doc));
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await buildAfterOperation({
            args,
            collection: collectionConfig,
            operation: 'findVersions',
            result
        });
        return result;
    } catch (error) {
        await killTransaction(args.req);
        throw error;
    }
};

//# sourceMappingURL=findVersions.js.map