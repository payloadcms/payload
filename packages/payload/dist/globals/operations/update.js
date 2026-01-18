import { executeAccess } from '../../auth/executeAccess.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { beforeChange } from '../../fields/hooks/beforeChange/index.js';
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js';
import { deepCopyObjectSimple } from '../../index.js';
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { getSelectMode } from '../../utilities/getSelectMode.js';
import { hasDraftsEnabled, hasDraftValidationEnabled } from '../../utilities/getVersionsConfig.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js';
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js';
import { saveVersion } from '../../versions/saveVersion.js';
export const updateOperation = async (args)=>{
    if (args.publishSpecificLocale) {
        args.req.locale = args.publishSpecificLocale;
    }
    const { slug, autosave, depth, disableTransaction, draft: draftArg, globalConfig, overrideAccess, overrideLock, populate, publishSpecificLocale, req: { fallbackLocale, locale, payload }, req, select: incomingSelect, showHiddenFields } = args;
    try {
        const shouldCommit = !disableTransaction && await initTransaction(req);
        // /////////////////////////////////////
        // beforeOperation - Global
        // /////////////////////////////////////
        if (globalConfig.hooks?.beforeOperation?.length) {
            for (const hook of globalConfig.hooks.beforeOperation){
                args = await hook({
                    args,
                    context: args.req.context,
                    global: globalConfig,
                    operation: 'update',
                    req: args.req
                }) || args;
            }
        }
        let { data } = args;
        const isSavingDraft = Boolean(draftArg && hasDraftsEnabled(globalConfig)) && data._status !== 'published';
        // /////////////////////////////////////
        // 1. Retrieve and execute access
        // /////////////////////////////////////
        const accessResults = !overrideAccess ? await executeAccess({
            data,
            req
        }, globalConfig.access.update) : true;
        // /////////////////////////////////////
        // Retrieve document
        // /////////////////////////////////////
        const query = overrideAccess ? undefined : accessResults;
        // /////////////////////////////////////
        // 2. Retrieve document
        // /////////////////////////////////////
        const globalVersionResult = await getLatestGlobalVersion({
            slug,
            config: globalConfig,
            locale: locale,
            payload,
            req,
            where: query
        });
        const { global, globalExists } = globalVersionResult || {};
        let globalJSON = {};
        if (globalVersionResult && globalVersionResult.global) {
            globalJSON = deepCopyObjectSimple(global);
            if (globalJSON._id) {
                delete globalJSON._id;
            }
        }
        const originalDoc = await afterRead({
            collection: null,
            context: req.context,
            depth: 0,
            doc: deepCopyObjectSimple(globalJSON),
            draft: draftArg,
            fallbackLocale: fallbackLocale,
            global: globalConfig,
            locale: locale,
            overrideAccess: true,
            req,
            showHiddenFields: showHiddenFields
        });
        // ///////////////////////////////////////////
        // Handle potentially locked global documents
        // ///////////////////////////////////////////
        await checkDocumentLockStatus({
            globalSlug: slug,
            lockErrorMessage: `Global with slug "${slug}" is currently locked by another user and cannot be updated.`,
            overrideLock,
            req
        });
        // /////////////////////////////////////
        // beforeValidate - Fields
        // /////////////////////////////////////
        data = await beforeValidate({
            collection: null,
            context: req.context,
            data,
            doc: originalDoc,
            global: globalConfig,
            operation: 'update',
            overrideAccess: overrideAccess,
            req
        });
        // /////////////////////////////////////
        // beforeValidate - Global
        // /////////////////////////////////////
        if (globalConfig.hooks?.beforeValidate?.length) {
            for (const hook of globalConfig.hooks.beforeValidate){
                data = await hook({
                    context: req.context,
                    data,
                    global: globalConfig,
                    originalDoc,
                    req
                }) || data;
            }
        }
        // /////////////////////////////////////
        // beforeChange - Global
        // /////////////////////////////////////
        if (globalConfig.hooks?.beforeChange?.length) {
            for (const hook of globalConfig.hooks.beforeChange){
                data = await hook({
                    context: req.context,
                    data,
                    global: globalConfig,
                    originalDoc,
                    req
                }) || data;
            }
        }
        // /////////////////////////////////////
        // beforeChange - Fields
        // /////////////////////////////////////
        const beforeChangeArgs = {
            collection: null,
            context: req.context,
            data,
            doc: originalDoc,
            docWithLocales: globalJSON,
            global: globalConfig,
            operation: 'update',
            req,
            skipValidation: isSavingDraft && !hasDraftValidationEnabled(globalConfig)
        };
        let result = await beforeChange(beforeChangeArgs);
        let snapshotToSave;
        if (payload.config.localization && globalConfig.versions) {
            if (publishSpecificLocale) {
                snapshotToSave = deepCopyObjectSimple(result);
                // the published data to save to the main document
                result = await beforeChange({
                    ...beforeChangeArgs,
                    docWithLocales: (await getLatestGlobalVersion({
                        slug,
                        config: globalConfig,
                        payload,
                        published: true,
                        req,
                        where: query
                    }))?.global || {}
                });
            }
        }
        // /////////////////////////////////////
        // Update
        // /////////////////////////////////////
        const select = sanitizeSelect({
            fields: globalConfig.flattenedFields,
            forceSelect: globalConfig.forceSelect,
            select: incomingSelect
        });
        if (!isSavingDraft) {
            const now = new Date().toISOString();
            // Ensure global has createdAt
            if (!result.createdAt) {
                result.createdAt = now;
            }
            // Ensure updatedAt date is always updated
            result.updatedAt = now;
            if (globalExists) {
                result = await payload.db.updateGlobal({
                    slug,
                    data: result,
                    req,
                    select
                });
            } else {
                result = await payload.db.createGlobal({
                    slug,
                    data: result,
                    req
                });
            }
        }
        // /////////////////////////////////////
        // Create version
        // /////////////////////////////////////
        if (globalConfig.versions) {
            const { globalType } = result;
            result = await saveVersion({
                autosave,
                docWithLocales: result,
                draft: isSavingDraft,
                global: globalConfig,
                operation: 'update',
                payload,
                publishSpecificLocale,
                req,
                select,
                snapshot: snapshotToSave
            });
            result = {
                ...result,
                globalType
            };
        }
        // /////////////////////////////////////
        // Execute globalType field if not selected
        // /////////////////////////////////////
        if (select && result.globalType) {
            const selectMode = getSelectMode(select);
            if (selectMode === 'include' && !select['globalType'] || selectMode === 'exclude' && select['globalType'] === false) {
                delete result['globalType'];
            }
        }
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = await afterRead({
            collection: null,
            context: req.context,
            depth: depth,
            doc: result,
            draft: draftArg,
            fallbackLocale: null,
            global: globalConfig,
            locale: locale,
            overrideAccess: overrideAccess,
            populate,
            req,
            select,
            showHiddenFields: showHiddenFields
        });
        // /////////////////////////////////////
        // afterRead - Global
        // /////////////////////////////////////
        if (globalConfig.hooks?.afterRead?.length) {
            for (const hook of globalConfig.hooks.afterRead){
                result = await hook({
                    context: req.context,
                    doc: result,
                    global: globalConfig,
                    req
                }) || result;
            }
        }
        // /////////////////////////////////////
        // afterChange - Fields
        // /////////////////////////////////////
        result = await afterChange({
            collection: null,
            context: req.context,
            data,
            doc: result,
            global: globalConfig,
            operation: 'update',
            previousDoc: originalDoc,
            req
        });
        // /////////////////////////////////////
        // afterChange - Global
        // /////////////////////////////////////
        if (globalConfig.hooks?.afterChange?.length) {
            for (const hook of globalConfig.hooks.afterChange){
                result = await hook({
                    context: req.context,
                    data,
                    doc: result,
                    global: globalConfig,
                    previousDoc: originalDoc,
                    req
                }) || result;
            }
        }
        // /////////////////////////////////////
        // Return results
        // /////////////////////////////////////
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return result;
    } catch (error) {
        await killTransaction(req);
        throw error;
    }
};

//# sourceMappingURL=update.js.map