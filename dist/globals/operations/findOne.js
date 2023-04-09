"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../auth");
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const replaceWithDraftIfAvailable_1 = __importDefault(require("../../versions/drafts/replaceWithDraftIfAvailable"));
const afterRead_1 = require("../../fields/hooks/afterRead");
async function findOne(args) {
    var _a;
    const { globalConfig, locale, req, req: { payload, }, slug, depth, showHiddenFields, draft: draftEnabled = false, overrideAccess = false, } = args;
    const { globals: { Model } } = payload;
    // /////////////////////////////////////
    // Retrieve and execute access
    // /////////////////////////////////////
    const queryToBuild = {
        where: {
            and: [
                {
                    globalType: {
                        equals: slug,
                    },
                },
            ],
        },
    };
    let accessResult;
    if (!overrideAccess) {
        accessResult = await (0, executeAccess_1.default)({ req }, globalConfig.access.read);
        if ((0, auth_1.hasWhereAccessResult)(accessResult)) {
            queryToBuild.where.and.push(accessResult);
        }
    }
    const query = await Model.buildQuery(queryToBuild, locale);
    // /////////////////////////////////////
    // Perform database operation
    // /////////////////////////////////////
    let doc = await Model.findOne(query).lean();
    if (!doc) {
        doc = {};
    }
    else if (doc._id) {
        doc.id = doc._id;
        delete doc._id;
    }
    doc = JSON.stringify(doc);
    doc = JSON.parse(doc);
    doc = (0, sanitizeInternalFields_1.default)(doc);
    // /////////////////////////////////////
    // Replace document with draft if available
    // /////////////////////////////////////
    if (((_a = globalConfig.versions) === null || _a === void 0 ? void 0 : _a.drafts) && draftEnabled) {
        doc = await (0, replaceWithDraftIfAvailable_1.default)({
            payload,
            entity: globalConfig,
            entityType: 'global',
            doc,
            locale,
            accessResult,
        });
    }
    // /////////////////////////////////////
    // Execute before global hook
    // /////////////////////////////////////
    await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
        await priorHook;
        doc = await hook({
            req,
            doc,
        }) || doc;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Execute field-level hooks and access
    // /////////////////////////////////////
    doc = await (0, afterRead_1.afterRead)({
        depth,
        doc,
        entityConfig: globalConfig,
        req,
        overrideAccess,
        showHiddenFields,
    });
    // /////////////////////////////////////
    // Execute after global hook
    // /////////////////////////////////////
    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;
        doc = await hook({
            req,
            doc,
        }) || doc;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return doc;
}
exports.default = findOne;
//# sourceMappingURL=findOne.js.map