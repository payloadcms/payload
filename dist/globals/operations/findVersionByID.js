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
async function findVersionByID(args) {
    const { depth, globalConfig, id, req, req: { t, payload, locale, }, disableErrors, currentDepth, overrideAccess, showHiddenFields, } = args;
    const VersionsModel = payload.versions[globalConfig.slug];
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    const accessResults = !overrideAccess ? await (0, executeAccess_1.default)({ req, disableErrors, id }, globalConfig.access.readVersions) : true;
    // If errors are disabled, and access returns false, return null
    if (accessResults === false)
        return null;
    const hasWhereAccess = typeof accessResults === 'object';
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
    if ((0, types_1.hasWhereAccessResult)(accessResults)) {
        queryToBuild.where.and.push(accessResults);
    }
    const query = await VersionsModel.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////
    if (!query.$and[0]._id)
        throw new errors_1.NotFound(t);
    let result = await VersionsModel.findOne(query, {}).lean();
    if (!result) {
        if (!disableErrors) {
            if (!hasWhereAccess)
                throw new errors_1.NotFound(t);
            if (hasWhereAccess)
                throw new errors_1.Forbidden(t);
        }
        return null;
    }
    // Clone the result - it may have come back memoized
    result = JSON.parse(JSON.stringify(result));
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;
        result.version = await hook({
            req,
            doc: result.version,
        }) || result.version;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result.version = await (0, afterRead_1.afterRead)({
        currentDepth,
        depth,
        doc: result.version,
        entityConfig: globalConfig,
        req,
        overrideAccess,
        showHiddenFields,
    });
    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////
    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;
        result.version = await hook({
            req,
            query,
            doc: result.version,
        }) || result.version;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return result;
}
exports.default = findVersionByID;
//# sourceMappingURL=findVersionByID.js.map