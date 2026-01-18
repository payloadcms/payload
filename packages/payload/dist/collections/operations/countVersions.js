import { executeAccess } from '../../auth/executeAccess.js';
import { combineQueries } from '../../database/combineQueries.js';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js';
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js';
import { buildVersionCollectionFields } from '../../index.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { buildAfterOperation } from './utilities/buildAfterOperation.js';
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countVersionsOperation = async (incomingArgs)=>{
    let args = incomingArgs;
    try {
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'countVersions'
        });
        const { collection: { config: collectionConfig }, disableErrors, overrideAccess, req, where } = args;
        const { locale, payload } = req;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        let accessResult;
        if (!overrideAccess) {
            accessResult = await executeAccess({
                disableErrors,
                req: req
            }, collectionConfig.access.readVersions);
            // If errors are disabled, and access returns false, return empty results
            if (accessResult === false) {
                return {
                    totalDocs: 0
                };
            }
        }
        let result;
        const fullWhere = combineQueries(where, accessResult);
        const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true);
        sanitizeWhereQuery({
            fields: versionFields,
            payload,
            where: fullWhere
        });
        await validateQueryPaths({
            collectionConfig,
            overrideAccess: overrideAccess,
            req: req,
            versionFields,
            where: where
        });
        result = await payload.db.countVersions({
            collection: collectionConfig.slug,
            locale: locale,
            req,
            where: fullWhere
        });
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await buildAfterOperation({
            args,
            collection: collectionConfig,
            operation: 'countVersions',
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

//# sourceMappingURL=countVersions.js.map