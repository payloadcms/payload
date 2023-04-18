"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
const micro_memoize_1 = __importDefault(require("micro-memoize"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const errors_1 = require("../../errors");
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const types_1 = require("../../auth/types");
const replaceWithDraftIfAvailable_1 = __importDefault(require("../../versions/drafts/replaceWithDraftIfAvailable"));
const afterRead_1 = require("../../fields/hooks/afterRead");
async function findByID(incomingArgs) {
    var _a;
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'read',
        })) || args;
    }, Promise.resolve());
    const { depth, collection: { Model, config: collectionConfig, }, id, req, req: { t, locale, payload, }, disableErrors, currentDepth, overrideAccess = false, showHiddenFields, draft: draftEnabled = false, } = args;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const accessResult = !overrideAccess ? await (0, executeAccess_1.default)({ req, disableErrors, id }, collectionConfig.access.read) : true;
    // If errors are disabled, and access returns false, return null
    if (accessResult === false)
        return null;
    const queryToBuild = {
        where: {
            and: [
                {
                    _id: {
                        equals: id,
                    },
                },
            ],
        },
    };
    if ((0, types_1.hasWhereAccessResult)(accessResult)) {
        queryToBuild.where.and.push(accessResult);
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////
    if (!query.$and[0]._id)
        throw new errors_1.NotFound(t);
    if (!req.findByID)
        req.findByID = {};
    if (!req.findByID[collectionConfig.slug]) {
        const nonMemoizedFindByID = async (q) => Model.findOne(q, {}).lean();
        req.findByID[collectionConfig.slug] = (0, micro_memoize_1.default)(nonMemoizedFindByID, {
            isPromise: true,
            maxSize: 100,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore This is straight from their docs, bad typings
            transformKey: JSON.stringify,
        });
    }
    let result = await req.findByID[collectionConfig.slug](query);
    if (!result) {
        if (!disableErrors) {
            throw new errors_1.NotFound(t);
        }
        return null;
    }
    // Clone the result - it may have come back memoized
    result = JSON.parse(JSON.stringify(result));
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // Replace document with draft if available
    // /////////////////////////////////////
    if (((_a = collectionConfig.versions) === null || _a === void 0 ? void 0 : _a.drafts) && draftEnabled) {
        result = await (0, replaceWithDraftIfAvailable_1.default)({
            payload,
            entity: collectionConfig,
            entityType: 'collection',
            doc: result,
            accessResult,
            locale,
        });
    }
    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            req,
            query,
            doc: result,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = await (0, afterRead_1.afterRead)({
        currentDepth,
        doc: result,
        depth,
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
            query,
            doc: result,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return result;
}
exports.default = findByID;
//# sourceMappingURL=findByID.js.map