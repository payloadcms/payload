"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const types_1 = require("../../auth/types");
const flattenWhereConstraints_1 = __importDefault(require("../../utilities/flattenWhereConstraints"));
const buildSortParam_1 = require("../../mongoose/buildSortParam");
const afterRead_1 = require("../../fields/hooks/afterRead");
const queryDrafts_1 = require("../../versions/drafts/queryDrafts");
async function find(incomingArgs) {
    var _a, _b;
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
    const { where, page, limit, depth, currentDepth, draft: draftsEnabled, collection, collection: { Model, config: collectionConfig, }, req, req: { locale, payload, }, overrideAccess, disableErrors, showHiddenFields, queryHiddenFields, pagination = true, } = args;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const queryToBuild = {
        where: {
            and: [],
        },
    };
    let useEstimatedCount = false;
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
        const constraints = (0, flattenWhereConstraints_1.default)(queryToBuild);
        useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
    }
    let accessResult;
    if (!overrideAccess) {
        accessResult = await (0, executeAccess_1.default)({ req, disableErrors }, collectionConfig.access.read);
        // If errors are disabled, and access returns false, return empty results
        if (accessResult === false) {
            return {
                docs: [],
                totalDocs: 0,
                totalPages: 1,
                page: 1,
                pagingCounter: 1,
                hasPrevPage: false,
                hasNextPage: false,
                prevPage: null,
                nextPage: null,
                limit,
            };
        }
        if ((0, types_1.hasWhereAccessResult)(accessResult)) {
            queryToBuild.where.and.push(accessResult);
        }
    }
    const query = await Model.buildQuery(queryToBuild, locale, queryHiddenFields);
    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////
    const [sortProperty, sortOrder] = (0, buildSortParam_1.buildSortParam)({
        sort: (_a = args.sort) !== null && _a !== void 0 ? _a : collectionConfig.defaultSort,
        config: payload.config,
        fields: collectionConfig.fields,
        timestamps: collectionConfig.timestamps,
        locale,
    });
    const usePagination = pagination && limit !== 0;
    const limitToUse = limit !== null && limit !== void 0 ? limit : (usePagination ? 10 : 0);
    let result;
    const paginationOptions = {
        page: page || 1,
        sort: {
            [sortProperty]: sortOrder,
        },
        limit: limitToUse,
        lean: true,
        leanWithId: true,
        useEstimatedCount,
        pagination: usePagination,
        useCustomCountFn: pagination ? undefined : () => Promise.resolve(1),
        options: {
            // limit must also be set here, it's ignored when pagination is false
            limit: limitToUse,
        },
    };
    if (((_b = collectionConfig.versions) === null || _b === void 0 ? void 0 : _b.drafts) && draftsEnabled) {
        result = await (0, queryDrafts_1.queryDrafts)({
            accessResult,
            collection,
            locale,
            paginationOptions,
            payload,
            where,
        });
    }
    else {
        result = await Model.paginate(query, paginationOptions);
    }
    result = {
        ...result,
        docs: result.docs.map((doc) => {
            const sanitizedDoc = JSON.parse(JSON.stringify(doc));
            sanitizedDoc.id = sanitizedDoc._id;
            return (0, sanitizeInternalFields_1.default)(sanitizedDoc);
        }),
    };
    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (doc) => {
            let docRef = doc;
            await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
                await priorHook;
                docRef = await hook({ req, query, doc: docRef }) || docRef;
            }, Promise.resolve());
            return docRef;
        })),
    };
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (doc) => (0, afterRead_1.afterRead)({
            depth,
            currentDepth,
            doc,
            entityConfig: collectionConfig,
            overrideAccess,
            req,
            showHiddenFields,
            findMany: true,
        }))),
    };
    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (doc) => {
            let docRef = doc;
            await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
                await priorHook;
                docRef = await hook({ req, query, doc: docRef, findMany: true }) || doc;
            }, Promise.resolve());
            return docRef;
        })),
    };
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return result;
}
exports.default = find;
//# sourceMappingURL=find.js.map