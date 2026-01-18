import { executeAccess } from '../../auth/executeAccess.js';
import { combineQueries } from '../../database/combineQueries.js';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js';
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { buildAfterOperation } from './utilities/buildAfterOperation.js';
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countOperation = async (incomingArgs)=>{
    let args = incomingArgs;
    try {
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'count'
        });
        const { collection: { config: collectionConfig }, disableErrors, overrideAccess, req, trash = false, where } = args;
        const { payload } = req;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        let accessResult;
        if (!overrideAccess) {
            accessResult = await executeAccess({
                disableErrors,
                req: req
            }, collectionConfig.access.read);
            // If errors are disabled, and access returns false, return empty results
            if (accessResult === false) {
                return {
                    totalDocs: 0
                };
            }
        }
        let result;
        let fullWhere = combineQueries(where, accessResult);
        sanitizeWhereQuery({
            fields: collectionConfig.flattenedFields,
            payload,
            where: fullWhere
        });
        // Exclude trashed documents when trash: false
        fullWhere = appendNonTrashedFilter({
            enableTrash: collectionConfig.trash,
            trash,
            where: fullWhere
        });
        await validateQueryPaths({
            collectionConfig,
            overrideAccess: overrideAccess,
            req: req,
            where: where
        });
        result = await payload.db.count({
            collection: collectionConfig.slug,
            req,
            where: fullWhere
        });
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await buildAfterOperation({
            args,
            collection: collectionConfig,
            operation: 'count',
            result
        });
        // /////////////////////////////////////
        // Return results
        // /////////////////////////////////////
        return result;
    } catch (error) {
        await killTransaction(args.req);
        throw error;
    }
};

//# sourceMappingURL=count.js.map