"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const errors_1 = require("../../errors");
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const types_1 = require("../../auth/types");
const afterRead_1 = require("../../fields/hooks/afterRead");
const deleteCollectionVersions_1 = require("../../versions/deleteCollectionVersions");
const deleteAssociatedFiles_1 = require("../../uploads/deleteAssociatedFiles");
async function deleteOperation(incomingArgs) {
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'delete',
        })) || args;
    }, Promise.resolve());
    const { depth, collection: { Model, config: collectionConfig, }, where, req, req: { t, locale, payload, payload: { config, preferences, }, }, overrideAccess, showHiddenFields, } = args;
    if (!where) {
        throw new errors_1.APIError('Missing \'where\' query of documents to delete.', http_status_1.default.BAD_REQUEST);
    }
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
        accessResult = await (0, executeAccess_1.default)({ req }, collectionConfig.access.delete);
        if ((0, types_1.hasWhereAccessResult)(accessResult)) {
            queryToBuild.where.and.push(accessResult);
        }
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////
    const docs = await Model.find(query, {}, { lean: true });
    const errors = [];
    /* eslint-disable no-param-reassign */
    const promises = docs.map(async (doc) => {
        let result;
        // custom id type reset
        doc.id = doc._id;
        doc = JSON.stringify(doc);
        doc = JSON.parse(doc);
        doc = (0, sanitizeInternalFields_1.default)(doc);
        const { id } = doc;
        try {
            // /////////////////////////////////////
            // beforeDelete - Collection
            // /////////////////////////////////////
            await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook) => {
                await priorHook;
                return hook({
                    req,
                    id,
                });
            }, Promise.resolve());
            await (0, deleteAssociatedFiles_1.deleteAssociatedFiles)({ config, collectionConfig, doc, t, overrideDelete: true });
            // /////////////////////////////////////
            // Delete document
            // /////////////////////////////////////
            await Model.deleteOne({ _id: id }, { lean: true });
            // /////////////////////////////////////
            // Delete versions
            // /////////////////////////////////////
            if (collectionConfig.versions) {
                (0, deleteCollectionVersions_1.deleteCollectionVersions)({
                    payload,
                    id,
                    slug: collectionConfig.slug,
                });
            }
            // /////////////////////////////////////
            // afterRead - Fields
            // /////////////////////////////////////
            result = await (0, afterRead_1.afterRead)({
                depth,
                doc: result || doc,
                entityConfig: collectionConfig,
                overrideAccess,
                req,
                showHiddenFields,
            });
            // /////////////////////////////////////
            // afterRead - Collection
            // /////////////////////////////////////
            await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
                await priorHook;
                result = await hook({
                    req,
                    doc: result || doc,
                }) || result;
            }, Promise.resolve());
            // /////////////////////////////////////
            // afterDelete - Collection
            // /////////////////////////////////////
            await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
                await priorHook;
                result = await hook({
                    req,
                    id,
                    doc: result,
                }) || result;
            }, Promise.resolve());
            // /////////////////////////////////////
            // 8. Return results
            // /////////////////////////////////////
            return result;
        }
        catch (error) {
            errors.push({
                message: error.message,
                id: doc.id,
            });
        }
        return null;
    });
    const awaitedDocs = await Promise.all(promises);
    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////
    if (collectionConfig.auth) {
        preferences.Model.deleteMany({
            user: { in: docs.map(({ id }) => id) },
            userCollection: collectionConfig.slug,
        });
    }
    preferences.Model.deleteMany({ key: { in: docs.map(({ id }) => `collection-${collectionConfig.slug}-${id}`) } });
    return {
        docs: awaitedDocs.filter(Boolean),
        errors,
    };
}
exports.default = deleteOperation;
//# sourceMappingURL=delete.js.map