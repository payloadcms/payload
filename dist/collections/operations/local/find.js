"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_1 = __importDefault(require("../find"));
const dataloader_1 = require("../../dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
async function findLocal(payload, options) {
    var _a, _b, _c, _d, _e;
    const { collection: collectionSlug, depth, currentDepth, page, limit, where, locale = null, fallbackLocale = null, user, overrideAccess = true, disableErrors, showHiddenFields, queryHiddenFields, sort, draft = false, pagination = true, req = {}, } = options;
    const collection = payload.collections[collectionSlug];
    const defaultLocale = ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.localization) ? (_c = (_b = payload === null || payload === void 0 ? void 0 : payload.config) === null || _b === void 0 ? void 0 : _b.localization) === null || _c === void 0 ? void 0 : _c.defaultLocale : null;
    if (!collection) {
        throw new errors_1.APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
    }
    req.payloadAPI = 'local';
    req.locale = (_d = locale !== null && locale !== void 0 ? locale : req === null || req === void 0 ? void 0 : req.locale) !== null && _d !== void 0 ? _d : defaultLocale;
    req.fallbackLocale = (_e = fallbackLocale !== null && fallbackLocale !== void 0 ? fallbackLocale : req === null || req === void 0 ? void 0 : req.fallbackLocale) !== null && _e !== void 0 ? _e : defaultLocale;
    req.i18n = (0, init_1.default)(payload.config.i18n);
    req.payload = payload;
    if (!req.t)
        req.t = req.i18n.t;
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    if (typeof user !== 'undefined')
        req.user = user;
    return (0, find_1.default)({
        depth,
        currentDepth,
        sort,
        page,
        limit,
        where,
        collection,
        overrideAccess,
        disableErrors,
        showHiddenFields,
        queryHiddenFields,
        draft,
        pagination,
        req,
    });
}
exports.default = findLocal;
//# sourceMappingURL=find.js.map