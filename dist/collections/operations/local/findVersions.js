"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findVersions_1 = __importDefault(require("../findVersions"));
const dataloader_1 = require("../../dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
async function findVersionsLocal(payload, options) {
    var _a, _b, _c;
    const { collection: collectionSlug, depth, page, limit, where, locale = null, fallbackLocale = null, user, overrideAccess = true, showHiddenFields, sort, } = options;
    const collection = payload.collections[collectionSlug];
    const defaultLocale = ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.localization) ? (_c = (_b = payload === null || payload === void 0 ? void 0 : payload.config) === null || _b === void 0 ? void 0 : _b.localization) === null || _c === void 0 ? void 0 : _c.defaultLocale : null;
    if (!collection) {
        throw new errors_1.APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
    }
    const i18n = (0, init_1.default)(payload.config.i18n);
    const req = {
        user,
        payloadAPI: 'local',
        locale: locale !== null && locale !== void 0 ? locale : defaultLocale,
        fallbackLocale: fallbackLocale !== null && fallbackLocale !== void 0 ? fallbackLocale : defaultLocale,
        payload,
        i18n,
    };
    if (!req.t)
        req.t = req.i18n.t;
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    return (0, findVersions_1.default)({
        where,
        page,
        limit,
        depth,
        collection,
        sort,
        overrideAccess,
        showHiddenFields,
        req,
    });
}
exports.default = findVersionsLocal;
//# sourceMappingURL=findVersions.js.map