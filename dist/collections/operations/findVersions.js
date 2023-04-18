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
const buildCollectionFields_1 = require("../../versions/buildCollectionFields");
async function findVersions(args) {
    const { where, page, limit, depth, collection: { config: collectionConfig, }, req, req: { locale, payload, }, overrideAccess, showHiddenFields, } = args;
    const VersionsModel = payload.versions[collectionConfig.slug];
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const queryToBuild = {};
    let useEstimatedCount = false;
    if (where) {
        let and = [];
        if (Array.isArray(where.and))
            and = where.and;
        if (Array.isArray(where.AND))
            and = where.AND;
        queryToBuild.where = {
            ...where,
            and: [
                ...and,
            ],
        };
        const constraints = (0, flattenWhereConstraints_1.default)(queryToBuild);
        useEstimatedCount = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'));
    }
    if (!overrideAccess) {
        const accessResults = await (0, executeAccess_1.default)({ req }, collectionConfig.access.readVersions);
        if ((0, types_1.hasWhereAccessResult)(accessResults)) {
            if (!where) {
                queryToBuild.where = {
                    and: [
                        accessResults,
                    ],
                };
            }
            else {
                queryToBuild.where.and.push(accessResults);
            }
        }
    }
    const query = await VersionsModel.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////
    const [sortProperty, sortOrder] = (0, buildSortParam_1.buildSortParam)({
        sort: args.sort || '-updatedAt',
        fields: (0, buildCollectionFields_1.buildVersionCollectionFields)(collectionConfig),
        timestamps: true,
        config: payload.config,
        locale,
    });
    const paginatedDocs = await VersionsModel.paginate(query, {
        page: page || 1,
        limit: limit !== null && limit !== void 0 ? limit : 10,
        sort: {
            [sortProperty]: sortOrder,
        },
        lean: true,
        leanWithId: true,
        useEstimatedCount,
    });
    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    let result = {
        ...paginatedDocs,
        docs: await Promise.all(paginatedDocs.docs.map(async (doc) => {
            const docString = JSON.stringify(doc);
            const docRef = JSON.parse(docString);
            await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
                await priorHook;
                docRef.version = await hook({ req, query, doc: docRef.version }) || docRef.version;
            }, Promise.resolve());
            return docRef;
        })),
    };
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (data) => ({
            ...data,
            version: await (0, afterRead_1.afterRead)({
                depth,
                doc: data.version,
                entityConfig: collectionConfig,
                overrideAccess,
                req,
                showHiddenFields,
                findMany: true,
            }),
        }))),
    };
    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////
    result = {
        ...result,
        docs: await Promise.all(result.docs.map(async (doc) => {
            const docRef = doc;
            await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
                await priorHook;
                docRef.version = await hook({ req, query, doc: doc.version, findMany: true }) || doc.version;
            }, Promise.resolve());
            return docRef;
        })),
    };
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    result = {
        ...result,
        docs: result.docs.map((doc) => (0, sanitizeInternalFields_1.default)(doc)),
    };
    return result;
}
exports.default = findVersions;
//# sourceMappingURL=findVersions.js.map