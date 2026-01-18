import { status as httpStatus } from 'http-status';
import { executeAccess } from '../../auth/executeAccess.js';
import { hasWhereAccessResult } from '../../auth/types.js';
import { combineQueries } from '../../database/combineQueries.js';
import { APIError, Forbidden, NotFound } from '../../errors/index.js';
import { deepCopyObjectSimple } from '../../index.js';
import { generateFileData } from '../../uploads/generateFileData.js';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js';
import { buildAfterOperation } from './utilities/buildAfterOperation.js';
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js';
import { updateDocument } from './utilities/update.js';
export const updateByIDOperation = async (incomingArgs)=>{
    let args = incomingArgs;
    try {
        const shouldCommit = !args.disableTransaction && await initTransaction(args.req);
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'update'
        });
        if (args.publishSpecificLocale) {
            args.req.locale = args.publishSpecificLocale;
        }
        const { id, autosave = false, collection: { config: collectionConfig }, collection, depth, draft: draftArg = false, overrideAccess, overrideLock, overwriteExistingFiles = false, populate, publishSpecificLocale, req: { fallbackLocale, locale, payload: { config }, payload }, req, select: incomingSelect, showHiddenFields, trash = false } = args;
        if (!id) {
            throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
        }
        const { data } = args;
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        const accessResults = !overrideAccess ? await executeAccess({
            id,
            data,
            req
        }, collectionConfig.access.update) : true;
        const hasWherePolicy = hasWhereAccessResult(accessResults);
        // /////////////////////////////////////
        // Retrieve document
        // /////////////////////////////////////
        const where = {
            id: {
                equals: id
            }
        };
        let fullWhere = combineQueries(where, accessResults);
        const isTrashAttempt = collectionConfig.trash && typeof data === 'object' && data !== null && 'deletedAt' in data && data.deletedAt != null;
        if (isTrashAttempt && !overrideAccess) {
            const deleteAccessResult = await executeAccess({
                req
            }, collectionConfig.access.delete);
            fullWhere = combineQueries(fullWhere, deleteAccessResult);
        }
        // Exclude trashed documents when trash: false
        fullWhere = appendNonTrashedFilter({
            enableTrash: collectionConfig.trash,
            trash,
            where: fullWhere
        });
        const findOneArgs = {
            collection: collectionConfig.slug,
            locale: locale,
            req,
            where: fullWhere
        };
        const docWithLocales = await getLatestCollectionVersion({
            id,
            config: collectionConfig,
            payload,
            query: findOneArgs,
            req
        });
        if (!docWithLocales && !hasWherePolicy) {
            throw new NotFound(req.t);
        }
        if (!docWithLocales && hasWherePolicy) {
            throw new Forbidden(req.t);
        }
        if (!docWithLocales) {
            throw new NotFound(req.t);
        }
        // /////////////////////////////////////
        // Generate data for all files and sizes
        // /////////////////////////////////////
        const { data: newFileData, files: filesToUpload } = await generateFileData({
            collection,
            config,
            data,
            operation: 'update',
            overwriteExistingFiles,
            req,
            throwOnMissingFile: false
        });
        const select = sanitizeSelect({
            fields: collectionConfig.flattenedFields,
            forceSelect: collectionConfig.forceSelect,
            select: incomingSelect
        });
        // ///////////////////////////////////////////////
        // Update document, runs all document level hooks
        // ///////////////////////////////////////////////
        let result = await updateDocument({
            id,
            accessResults,
            autosave,
            collectionConfig,
            config,
            data: deepCopyObjectSimple(newFileData),
            depth: depth,
            docWithLocales,
            draftArg,
            fallbackLocale: fallbackLocale,
            filesToUpload,
            locale: locale,
            overrideAccess: overrideAccess,
            overrideLock: overrideLock,
            payload,
            populate,
            publishSpecificLocale,
            req,
            select: select,
            showHiddenFields: showHiddenFields
        });
        await unlinkTempFiles({
            collectionConfig,
            config,
            req
        });
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await buildAfterOperation({
            args,
            collection: collectionConfig,
            operation: 'updateByID',
            result
        });
        // /////////////////////////////////////
        // Return results
        // /////////////////////////////////////
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return result;
    } catch (error) {
        await killTransaction(args.req);
        throw error;
    }
};

//# sourceMappingURL=updateByID.js.map