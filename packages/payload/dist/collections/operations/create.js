import crypto from 'crypto';
import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js';
import { executeAccess } from '../../auth/executeAccess.js';
import { sendVerificationEmail } from '../../auth/sendVerificationEmail.js';
import { registerLocalStrategy } from '../../auth/strategies/local/register.js';
import { getDuplicateDocumentData } from '../../duplicateDocument/index.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { beforeChange } from '../../fields/hooks/beforeChange/index.js';
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js';
import { saveVersion } from '../../index.js';
import { generateFileData } from '../../uploads/generateFileData.js';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js';
import { uploadFiles } from '../../uploads/uploadFiles.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { hasDraftsEnabled, hasDraftValidationEnabled } from '../../utilities/getVersionsConfig.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js';
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js';
import { buildAfterOperation } from './utilities/buildAfterOperation.js';
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js';
export const createOperation = async (incomingArgs)=>{
    let args = incomingArgs;
    try {
        const shouldCommit = !args.disableTransaction && await initTransaction(args.req);
        ensureUsernameOrEmail({
            authOptions: args.collection.config.auth,
            collectionSlug: args.collection.config.slug,
            data: args.data,
            operation: 'create',
            req: args.req
        });
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'create'
        });
        if (args.publishSpecificLocale) {
            args.req.locale = args.publishSpecificLocale;
        }
        const { autosave = false, collection: { config: collectionConfig }, collection, depth, disableVerificationEmail, draft = false, duplicateFromID, overrideAccess, overwriteExistingFiles = false, populate, publishSpecificLocale, req: { fallbackLocale, locale, payload, payload: { config } }, req, select: incomingSelect, selectedLocales, showHiddenFields } = args;
        let { data } = args;
        const isSavingDraft = Boolean(draft && hasDraftsEnabled(collectionConfig));
        let duplicatedFromDocWithLocales = {};
        let duplicatedFromDoc = {};
        if (duplicateFromID) {
            const duplicateResult = await getDuplicateDocumentData({
                id: duplicateFromID,
                collectionConfig,
                draftArg: isSavingDraft,
                overrideAccess,
                req,
                selectedLocales
            });
            duplicatedFromDoc = duplicateResult.duplicatedFromDoc;
            duplicatedFromDocWithLocales = duplicateResult.duplicatedFromDocWithLocales;
        }
        // /////////////////////////////////////
        // Access
        // /////////////////////////////////////
        if (!overrideAccess) {
            await executeAccess({
                data,
                req
            }, collectionConfig.access.create);
        }
        // /////////////////////////////////////
        // Generate data for all files and sizes
        // /////////////////////////////////////
        const { data: newFileData, files: filesToUpload } = await generateFileData({
            collection,
            config,
            data,
            isDuplicating: Boolean(duplicateFromID),
            operation: 'create',
            originalDoc: duplicatedFromDoc,
            overwriteExistingFiles,
            req,
            throwOnMissingFile: !isSavingDraft && collection.config.upload.filesRequiredOnCreate !== false
        });
        data = newFileData;
        // /////////////////////////////////////
        // beforeValidate - Fields
        // /////////////////////////////////////
        data = await beforeValidate({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: duplicatedFromDoc,
            global: null,
            operation: 'create',
            overrideAccess: overrideAccess,
            req
        });
        // /////////////////////////////////////
        // beforeValidate - Collections
        // /////////////////////////////////////
        if (collectionConfig.hooks.beforeValidate?.length) {
            for (const hook of collectionConfig.hooks.beforeValidate){
                data = await hook({
                    collection: collectionConfig,
                    context: req.context,
                    data,
                    operation: 'create',
                    originalDoc: duplicatedFromDoc,
                    req
                }) || data;
            }
        }
        // /////////////////////////////////////
        // beforeChange - Collection
        // /////////////////////////////////////
        if (collectionConfig.hooks?.beforeChange?.length) {
            for (const hook of collectionConfig.hooks.beforeChange){
                data = await hook({
                    collection: collectionConfig,
                    context: req.context,
                    data,
                    operation: 'create',
                    originalDoc: duplicatedFromDoc,
                    req
                }) || data;
            }
        }
        // /////////////////////////////////////
        // beforeChange - Fields
        // /////////////////////////////////////
        const resultWithLocales = await beforeChange({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: duplicatedFromDoc,
            docWithLocales: duplicatedFromDocWithLocales,
            global: null,
            operation: 'create',
            overrideAccess,
            req,
            skipValidation: isSavingDraft && !hasDraftValidationEnabled(collectionConfig)
        });
        // /////////////////////////////////////
        // Write files to local storage
        // /////////////////////////////////////
        if (!collectionConfig.upload.disableLocalStorage) {
            await uploadFiles(payload, filesToUpload, req);
        }
        // /////////////////////////////////////
        // Create
        // /////////////////////////////////////
        let doc;
        const select = sanitizeSelect({
            fields: collectionConfig.flattenedFields,
            forceSelect: collectionConfig.forceSelect,
            select: incomingSelect
        });
        if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
            if (collectionConfig.auth.verify) {
                resultWithLocales._verified = Boolean(resultWithLocales._verified) || false;
                resultWithLocales._verificationToken = crypto.randomBytes(20).toString('hex');
            }
            doc = await registerLocalStrategy({
                collection: collectionConfig,
                doc: resultWithLocales,
                password: data.password,
                payload: req.payload,
                req
            });
        } else {
            doc = await payload.db.create({
                collection: collectionConfig.slug,
                data: resultWithLocales,
                req
            });
        }
        const verificationToken = doc._verificationToken;
        let result = sanitizeInternalFields(doc);
        // /////////////////////////////////////
        // Create version
        // /////////////////////////////////////
        if (collectionConfig.versions) {
            await saveVersion({
                id: result.id,
                autosave,
                collection: collectionConfig,
                docWithLocales: result,
                operation: 'create',
                payload,
                publishSpecificLocale,
                req,
                returning: false
            });
        }
        // /////////////////////////////////////
        // Send verification email if applicable
        // /////////////////////////////////////
        if (collectionConfig.auth && collectionConfig.auth.verify && result.email) {
            await sendVerificationEmail({
                collection: {
                    config: collectionConfig
                },
                config: payload.config,
                disableEmail: disableVerificationEmail,
                email: payload.email,
                req,
                token: verificationToken,
                user: result
            });
        }
        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////
        result = await afterRead({
            collection: collectionConfig,
            context: req.context,
            depth: depth,
            doc: result,
            draft,
            fallbackLocale: fallbackLocale,
            global: null,
            locale: locale,
            overrideAccess: overrideAccess,
            populate,
            req,
            select,
            showHiddenFields: showHiddenFields
        });
        // /////////////////////////////////////
        // afterRead - Collection
        // /////////////////////////////////////
        if (collectionConfig.hooks?.afterRead?.length) {
            for (const hook of collectionConfig.hooks.afterRead){
                result = await hook({
                    collection: collectionConfig,
                    context: req.context,
                    doc: result,
                    req
                }) || result;
            }
        }
        // /////////////////////////////////////
        // afterChange - Fields
        // /////////////////////////////////////
        result = await afterChange({
            collection: collectionConfig,
            context: req.context,
            data,
            doc: result,
            global: null,
            operation: 'create',
            previousDoc: {},
            req
        });
        // /////////////////////////////////////
        // afterChange - Collection
        // /////////////////////////////////////
        if (collectionConfig.hooks?.afterChange?.length) {
            for (const hook of collectionConfig.hooks.afterChange){
                result = await hook({
                    collection: collectionConfig,
                    context: req.context,
                    data,
                    doc: result,
                    operation: 'create',
                    previousDoc: {},
                    req: args.req
                }) || result;
            }
        }
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        result = await buildAfterOperation({
            args,
            collection: collectionConfig,
            operation: 'create',
            result
        });
        await unlinkTempFiles({
            collectionConfig,
            config,
            req
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

//# sourceMappingURL=create.js.map