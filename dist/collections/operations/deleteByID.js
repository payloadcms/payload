"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const errors_1 = require("../../errors");
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const types_1 = require("../../auth/types");
const afterRead_1 = require("../../fields/hooks/afterRead");
const deleteCollectionVersions_1 = require("../../versions/deleteCollectionVersions");
const deleteAssociatedFiles_1 = require("../../uploads/deleteAssociatedFiles");
async function deleteByID(incomingArgs) {
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
    const { depth, collection: { Model, config: collectionConfig, }, id, req, req: { t, locale, payload, payload: { config, preferences, }, }, overrideAccess, showHiddenFields, } = args;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const accessResults = !overrideAccess ? await (0, executeAccess_1.default)({ req, id }, collectionConfig.access.delete) : true;
    const hasWhereAccess = (0, types_1.hasWhereAccessResult)(accessResults);
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
    const docToDelete = await Model.findOne(query);
    if (!docToDelete && !hasWhereAccess)
        throw new errors_1.NotFound(t);
    if (!docToDelete && hasWhereAccess)
        throw new errors_1.Forbidden(t);
    const resultToDelete = docToDelete.toJSON({ virtuals: true });
    await (0, deleteAssociatedFiles_1.deleteAssociatedFiles)({ config, collectionConfig, doc: resultToDelete, t, overrideDelete: true });
    // /////////////////////////////////////
    // Delete document
    // /////////////////////////////////////
    const doc = await Model.findOneAndDelete({ _id: id });
    let result = doc.toJSON({ virtuals: true });
    // custom id type reset
    result.id = result._id;
    result = JSON.stringify(result);
    result = JSON.parse(result);
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////
    if (collectionConfig.auth) {
        await preferences.Model.deleteMany({ user: id, userCollection: collectionConfig.slug });
    }
    await preferences.Model.deleteMany({ key: `collection-${collectionConfig.slug}-${id}` });
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
        doc: result,
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
            doc: result,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterDelete - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({ req, id, doc: result }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////
    return result;
}
exports.default = deleteByID;
//# sourceMappingURL=deleteByID.js.map