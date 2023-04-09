"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const errors_1 = require("../../errors");
const types_1 = require("../../auth/types");
const saveVersion_1 = require("../../versions/saveVersion");
const uploadFiles_1 = require("../../uploads/uploadFiles");
const beforeChange_1 = require("../../fields/hooks/beforeChange");
const beforeValidate_1 = require("../../fields/hooks/beforeValidate");
const afterChange_1 = require("../../fields/hooks/afterChange");
const afterRead_1 = require("../../fields/hooks/afterRead");
const generateFileData_1 = require("../../uploads/generateFileData");
const getLatestCollectionVersion_1 = require("../../versions/getLatestCollectionVersion");
const deleteAssociatedFiles_1 = require("../../uploads/deleteAssociatedFiles");
const unlinkTempFiles_1 = require("../../uploads/unlinkTempFiles");
async function updateByID(incomingArgs) {
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'update',
        })) || args;
    }, Promise.resolve());
    const { depth, collection, collection: { Model, config: collectionConfig, }, id, req, req: { t, locale, payload, payload: { config, }, }, overrideAccess, showHiddenFields, overwriteExistingFiles = false, draft: draftArg = false, autosave = false, } = args;
    if (!id) {
        throw new errors_1.APIError('Missing ID of document to update.', http_status_1.default.BAD_REQUEST);
    }
    let { data } = args;
    const { password } = data;
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);
    const shouldSavePassword = Boolean(password && collectionConfig.auth && !shouldSaveDraft);
    const lean = !shouldSavePassword;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const accessResults = !overrideAccess ? await (0, executeAccess_1.default)({ req, id, data }, collectionConfig.access.update) : true;
    const hasWherePolicy = (0, types_1.hasWhereAccessResult)(accessResults);
    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    const queryToBuild = {
        where: {
            and: [
                {
                    id: {
                        equals: id,
                    },
                },
            ],
        },
    };
    if ((0, types_1.hasWhereAccessResult)(accessResults)) {
        queryToBuild.where.and.push(accessResults);
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    const doc = await (0, getLatestCollectionVersion_1.getLatestCollectionVersion)({
        payload,
        Model,
        config: collectionConfig,
        id,
        query,
        lean,
    });
    if (!doc && !hasWherePolicy)
        throw new errors_1.NotFound(t);
    if (!doc && hasWherePolicy)
        throw new errors_1.Forbidden(t);
    let docWithLocales = JSON.stringify(lean ? doc : doc.toJSON({ virtuals: true }));
    docWithLocales = JSON.parse(docWithLocales);
    const originalDoc = await (0, afterRead_1.afterRead)({
        depth: 0,
        doc: docWithLocales,
        entityConfig: collectionConfig,
        req,
        overrideAccess: true,
        showHiddenFields: true,
    });
    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////
    const { data: newFileData, files: filesToUpload } = await (0, generateFileData_1.generateFileData)({
        config,
        collection,
        req,
        data,
        throwOnMissingFile: false,
        overwriteExistingFiles,
    });
    data = newFileData;
    // /////////////////////////////////////
    // Delete any associated files
    // /////////////////////////////////////
    await (0, deleteAssociatedFiles_1.deleteAssociatedFiles)({ config, collectionConfig, files: filesToUpload, doc, t, overrideDelete: false });
    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////
    data = await (0, beforeValidate_1.beforeValidate)({
        data,
        doc: originalDoc,
        entityConfig: collectionConfig,
        id,
        operation: 'update',
        overrideAccess,
        req,
    });
    // /////////////////////////////////////
    // beforeValidate - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
        await priorHook;
        data = (await hook({
            data,
            req,
            operation: 'update',
            originalDoc,
        })) || data;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Write files to local storage
    // /////////////////////////////////////
    if (!collectionConfig.upload.disableLocalStorage) {
        await (0, uploadFiles_1.uploadFiles)(payload, filesToUpload, t);
    }
    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
        await priorHook;
        data = (await hook({
            data,
            req,
            originalDoc,
            operation: 'update',
        })) || data;
    }, Promise.resolve());
    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////
    let result = await (0, beforeChange_1.beforeChange)({
        data,
        doc: originalDoc,
        docWithLocales,
        entityConfig: collectionConfig,
        id,
        operation: 'update',
        req,
        skipValidation: shouldSaveDraft || data._status === 'draft',
    });
    // /////////////////////////////////////
    // Handle potential password update
    // /////////////////////////////////////
    if (shouldSavePassword) {
        await doc.setPassword(password);
        await doc.save();
        delete data.password;
        delete result.password;
    }
    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////
    if (!shouldSaveDraft) {
        try {
            result = await Model.findByIdAndUpdate({ _id: id }, result, { new: true });
        }
        catch (error) {
            // Handle uniqueness error from MongoDB
            throw error.code === 11000 && error.keyValue
                ? new errors_1.ValidationError([{ message: 'Value must be unique', field: Object.keys(error.keyValue)[0] }], t)
                : error;
        }
    }
    result = JSON.parse(JSON.stringify(result));
    result.id = result._id;
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////
    if (collectionConfig.versions) {
        result = await (0, saveVersion_1.saveVersion)({
            payload,
            collection: collectionConfig,
            req,
            docWithLocales: {
                ...result,
                createdAt: docWithLocales.createdAt,
            },
            id,
            autosave,
            draft: shouldSaveDraft,
        });
    }
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = await (0, afterRead_1.afterRead)({
        depth,
        doc: result,
        entityConfig: collectionConfig,
        req,
        overrideAccess,
        showHiddenFields,
    });
    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            req,
            doc: result,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////
    result = await (0, afterChange_1.afterChange)({
        data,
        doc: result,
        previousDoc: originalDoc,
        entityConfig: collectionConfig,
        operation: 'update',
        req,
    });
    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            doc: result,
            previousDoc: originalDoc,
            req,
            operation: 'update',
        }) || result;
    }, Promise.resolve());
    await (0, unlinkTempFiles_1.unlinkTempFiles)({
        req,
        config,
        collectionConfig,
    });
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return result;
}
exports.default = updateByID;
//# sourceMappingURL=updateByID.js.map