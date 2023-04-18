"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const delete_1 = __importDefault(require("../delete"));
const deleteByID_1 = __importDefault(require("../deleteByID"));
const dataloader_1 = require("../../dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
async function deleteLocal(payload, options) {
    var _a, _b, _c;
    const { collection: collectionSlug, depth, id, where, locale = null, fallbackLocale = null, user, overrideAccess = true, showHiddenFields, } = options;
    const collection = payload.collections[collectionSlug];
    const defaultLocale = ((_a = payload === null || payload === void 0 ? void 0 : payload.config) === null || _a === void 0 ? void 0 : _a.localization) ? (_c = (_b = payload === null || payload === void 0 ? void 0 : payload.config) === null || _b === void 0 ? void 0 : _b.localization) === null || _c === void 0 ? void 0 : _c.defaultLocale : null;
    if (!collection) {
        throw new errors_1.APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
    }
    const req = {
        user,
        payloadAPI: 'local',
        locale: locale !== null && locale !== void 0 ? locale : defaultLocale,
        fallbackLocale: fallbackLocale !== null && fallbackLocale !== void 0 ? fallbackLocale : defaultLocale,
        payload,
        i18n: (0, init_1.default)(payload.config.i18n),
    };
    if (!req.t)
        req.t = req.i18n.t;
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    const args = {
        depth,
        id,
        where,
        collection,
        overrideAccess,
        showHiddenFields,
        req,
    };
    if (options.id) {
        return (0, deleteByID_1.default)(args);
    }
    return (0, delete_1.default)(args);
}
exports.default = deleteLocal;
//# sourceMappingURL=delete.js.map