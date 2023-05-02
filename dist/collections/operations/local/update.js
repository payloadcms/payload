"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getFileByPath_1 = __importDefault(require("../../../uploads/getFileByPath"));
const update_1 = __importDefault(require("../update"));
const dataloader_1 = require("../../dataloader");
const init_1 = __importDefault(require("../../../translations/init"));
const errors_1 = require("../../../errors");
const updateByID_1 = __importDefault(require("../updateByID"));
async function updateLocal(payload, options) {
    var _a;
    const { collection: collectionSlug, depth, locale = null, fallbackLocale = null, data, user, overrideAccess = true, showHiddenFields, filePath, file, overwriteExistingFiles = false, draft, autosave, id, where, } = options;
    const collection = payload.collections[collectionSlug];
    if (!collection) {
        throw new errors_1.APIError(`The collection with slug ${String(collectionSlug)} can't be found.`);
    }
    const i18n = (0, init_1.default)(payload.config.i18n);
    const defaultLocale = payload.config.localization ? (_a = payload.config.localization) === null || _a === void 0 ? void 0 : _a.defaultLocale : null;
    const req = {
        user,
        payloadAPI: 'local',
        locale: locale !== null && locale !== void 0 ? locale : defaultLocale,
        fallbackLocale: fallbackLocale !== null && fallbackLocale !== void 0 ? fallbackLocale : defaultLocale,
        payload,
        i18n,
        files: {
            file: file !== null && file !== void 0 ? file : await (0, getFileByPath_1.default)(filePath),
        },
    };
    if (!req.t)
        req.t = req.i18n.t;
    if (!req.payloadDataLoader)
        req.payloadDataLoader = (0, dataloader_1.getDataLoader)(req);
    const args = {
        depth,
        data,
        collection,
        overrideAccess,
        showHiddenFields,
        overwriteExistingFiles,
        draft,
        autosave,
        payload,
        req,
        id,
        where,
    };
    if (options.id) {
        return (0, updateByID_1.default)(args);
    }
    return (0, update_1.default)(args);
}
exports.default = updateLocal;
//# sourceMappingURL=update.js.map