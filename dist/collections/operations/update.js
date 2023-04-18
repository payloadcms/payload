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
const queryDrafts_1 = require("../../versions/drafts/queryDrafts");
const deleteAssociatedFiles_1 = require("../../uploads/deleteAssociatedFiles");
const unlinkTempFiles_1 = require("../../uploads/unlinkTempFiles");
async function update(incomingArgs) {
    var _a;
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
    const { depth, collection, collection: { Model, config: collectionConfig, }, where, req, req: { t, locale, payload, payload: { config, }, }, overrideAccess, showHiddenFields, overwriteExistingFiles = false, draft: draftArg = false, } = args;
    if (!where) {
        throw new errors_1.APIError('Missing \'where\' query of documents to update.', http_status_1.default.BAD_REQUEST);
    }
    let { data } = args;
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const queryToBuild = {
        where: {
            and: [],
        },
    };
    if (where) {
        queryToBuild.where = {
            and: [],
            ...where,
        };
        if (Array.isArray(where.AND)) {
            queryToBuild.where.and = [
                ...queryToBuild.where.and,
                ...where.AND,
            ];
        }
    }
    let accessResult;
    if (!overrideAccess) {
        accessResult = await (0, executeAccess_1.default)({ req }, collectionConfig.access.update);
        if ((0, types_1.hasWhereAccessResult)(accessResult)) {
            queryToBuild.where.and.push(accessResult);
        }
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////
    let docs;
    if (((_a = collectionConfig.versions) === null || _a === void 0 ? void 0 : _a.drafts) && shouldSaveDraft) {
        docs = await (0, queryDrafts_1.queryDrafts)({
            accessResult,
            collection,
            locale,
            payload,
            where: query,
        });
    }
    else {
        docs = await Model.find(query, {}, { lean: true });
    }
    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////
    const { data: newFileData, files: filesToUpload, } = await (0, generateFileData_1.generateFileData)({
        config,
        collection,
        req,
        data,
        throwOnMissingFile: false,
        overwriteExistingFiles,
    });
    data = newFileData;
    const errors = [];
    const promises = docs.map(async (doc) => {
        let docWithLocales = JSON.stringify(doc);
        docWithLocales = JSON.parse(docWithLocales);
        const id = docWithLocales._id;
        try {
            const originalDoc = await (0, afterRead_1.afterRead)({
                depth: 0,
                doc: docWithLocales,
                entityConfig: collectionConfig,
                req,
                overrideAccess: true,
                showHiddenFields: true,
            });
            await (0, deleteAssociatedFiles_1.deleteAssociatedFiles)({ config, collectionConfig, files: filesToUpload, doc: docWithLocales, t, overrideDelete: false });
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
            // Update
            // /////////////////////////////////////
            if (!shouldSaveDraft) {
                try {
                    result = await Model.findByIdAndUpdate({ _id: id }, result, { new: true });
                }
                catch (error) {
                    // Handle uniqueness error from MongoDB
                    throw error.code === 11000 && error.keyValue
                        ? new errors_1.ValidationError([{
                                message: 'Value must be unique',
                                field: Object.keys(error.keyValue)[0],
                            }], t)
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
        catch (error) {
            errors.push({
                message: error.message,
                id,
            });
        }
        return null;
    });
    const awaitedDocs = await Promise.all(promises);
    return {
        docs: awaitedDocs.filter(Boolean),
        errors,
    };
}
exports.default = update;
//# sourceMappingURL=update.js.map