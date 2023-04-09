"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../../errors");
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const types_1 = require("../../auth/types");
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const afterChange_1 = require("../../fields/hooks/afterChange");
const afterRead_1 = require("../../fields/hooks/afterRead");
const getLatestCollectionVersion_1 = require("../../versions/getLatestCollectionVersion");
async function restoreVersion(args) {
    const { collection: { Model, config: collectionConfig, }, id, overrideAccess = false, showHiddenFields, depth, req: { t, locale, payload, }, req, } = args;
    if (!id) {
        throw new errors_1.APIError('Missing ID of version to restore.', http_status_1.default.BAD_REQUEST);
    }
    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////
    const VersionModel = payload.versions[collectionConfig.slug];
    let rawVersion = await VersionModel.findOne({
        _id: id,
    });
    if (!rawVersion) {
        throw new errors_1.NotFound(t);
    }
    rawVersion = rawVersion.toJSON({ virtuals: true });
    const parentDocID = rawVersion.parent;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const accessResults = !overrideAccess ? await (0, executeAccess_1.default)({ req, id: parentDocID }, collectionConfig.access.update) : true;
    const hasWherePolicy = (0, types_1.hasWhereAccessResult)(accessResults);
    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    const queryToBuild = {
        where: {
            and: [
                {
                    id: {
                        equals: parentDocID,
                    },
                },
            ],
        },
    };
    if ((0, types_1.hasWhereAccessResult)(accessResults)) {
        queryToBuild.where.and.push(accessResults);
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    const doc = await Model.findOne(query);
    if (!doc && !hasWherePolicy)
        throw new errors_1.NotFound(t);
    if (!doc && hasWherePolicy)
        throw new errors_1.Forbidden(t);
    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////
    const prevDocWithLocales = await (0, getLatestCollectionVersion_1.getLatestCollectionVersion)({
        payload,
        id: parentDocID,
        query,
        Model,
        config: collectionConfig,
    });
    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////
    let result = await Model.findByIdAndUpdate({ _id: parentDocID }, rawVersion.version, { new: true });
    result = result.toJSON({ virtuals: true });
    // custom id type reset
    result.id = result._id;
    result = JSON.parse(JSON.stringify(result));
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // Save `previousDoc` as a version after restoring
    // /////////////////////////////////////
    const prevVersion = { ...prevDocWithLocales };
    delete prevVersion.id;
    await VersionModel.create({
        parent: parentDocID,
        version: rawVersion.version,
        autosave: false,
        createdAt: prevVersion.createdAt,
        updatedAt: new Date().toISOString(),
    });
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
        data: result,
        doc: result,
        previousDoc: prevDocWithLocales,
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
            req,
            previousDoc: prevDocWithLocales,
            operation: 'update',
        }) || result;
    }, Promise.resolve());
    return result;
}
exports.default = restoreVersion;
//# sourceMappingURL=restoreVersion.js.map