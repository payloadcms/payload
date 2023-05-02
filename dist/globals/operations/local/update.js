"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = __importDefault(require("../update"));
const dataloader_1 = require("../../../collections/dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
async function updateLocal(payload, options) {
    var _a;
    const { slug: globalSlug, depth, locale = payload.config.localization ? (_a = payload.config.localization) === null || _a === void 0 ? void 0 : _a.defaultLocale : null, fallbackLocale = null, data, user, overrideAccess = true, showHiddenFields, draft, } = options;
    const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug);
    const i18n = (0, init_1.default)(payload.config.i18n);
    if (!globalConfig) {
        throw new errors_1.APIError(`The global with slug ${String(globalSlug)} can't be found.`);
    }
    const req = {
        user,
        payloadAPI: 'local',
        locale,
        fallbackLocale,
        payload,
        i18n,
        t: i18n.t,
    };
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    return (0, update_1.default)({
        slug: globalSlug,
        data,
        depth,
        globalConfig,
        overrideAccess,
        showHiddenFields,
        draft,
        req,
    });
}
exports.default = updateLocal;
//# sourceMappingURL=update.js.map