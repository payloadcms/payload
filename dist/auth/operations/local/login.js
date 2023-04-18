"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = __importDefault(require("../login"));
const dataloader_1 = require("../../../collections/dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
async function localLogin(payload, options) {
    const { collection: collectionSlug, req = {}, res, depth, locale, fallbackLocale, data, overrideAccess = true, showHiddenFields, } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new errors_1.APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
    }
    req.payloadAPI = 'local';
    req.payload = payload;
    req.i18n = (0, init_1.default)(payload.config.i18n);
    req.locale = undefined;
    req.fallbackLocale = undefined;
    if (!req.t)
        req.t = req.i18n.t;
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    const args = {
        depth,
        collection,
        overrideAccess,
        showHiddenFields,
        data,
        req,
        res,
    };
    if (locale)
        args.req.locale = locale;
    if (fallbackLocale)
        args.req.fallbackLocale = fallbackLocale;
    return (0, login_1.default)(args);
}
exports.default = localLogin;
//# sourceMappingURL=login.js.map