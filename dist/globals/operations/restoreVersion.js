"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const errors_1 = require("../../errors");
const afterChange_1 = require("../../fields/hooks/afterChange");
const afterRead_1 = require("../../fields/hooks/afterRead");
async function restoreVersion(args) {
    const { id, depth, globalConfig, req, req: { t, payload, payload: { globals: { Model, }, }, }, overrideAccess, showHiddenFields, } = args;
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    if (!overrideAccess) {
        await (0, executeAccess_1.default)({ req }, globalConfig.access.update);
    }
    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////
    const VersionModel = payload.versions[globalConfig.slug];
    let rawVersion = await VersionModel.findOne({
        _id: id,
    });
    if (!rawVersion) {
        throw new errors_1.NotFound(t);
    }
    rawVersion = rawVersion.toJSON({ virtuals: true });
    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////
    const previousDoc = await payload.findGlobal({
        slug: globalConfig.slug,
        depth,
    });
    // /////////////////////////////////////
    // Update global
    // /////////////////////////////////////
    const global = await Model.findOne({ globalType: globalConfig.slug });
    let result = rawVersion.version;
    if (global) {
        result = await Model.findOneAndUpdate({ globalType: globalConfig.slug }, result, { new: true });
    }
    else {
        result.globalType = globalConfig.slug;
        result = await Model.create(result);
    }
    result = result.toJSON({ virtuals: true });
    // custom id type reset
    result.id = result._id;
    result = JSON.stringify(result);
    result = JSON.parse(result);
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = await (0, afterRead_1.afterRead)({
        depth,
        doc: result,
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
        result = await hook({
            doc: result,
            req,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////
    result = await (0, afterChange_1.afterChange)({
        data: result,
        doc: result,
        previousDoc,
        entityConfig: globalConfig,
        operation: 'update',
        req,
    });
    // /////////////////////////////////////
    // afterChange - Global
    // /////////////////////////////////////
    await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            doc: result,
            previousDoc,
            req,
        }) || result;
    }, Promise.resolve());
    return result;
}
exports.default = restoreVersion;
//# sourceMappingURL=restoreVersion.js.map