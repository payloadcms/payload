"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = void 0;
const i18next_1 = __importDefault(require("i18next"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const defaultOptions_1 = require("../../translations/defaultOptions");
const i18nMiddleware = (options) => {
    i18next_1.default.use(i18next_http_middleware_1.default.LanguageDetector)
        .init({
        preload: defaultOptions_1.defaultOptions.supportedLngs,
        ...(0, deepmerge_1.default)(defaultOptions_1.defaultOptions, options || {}),
    });
    return i18next_http_middleware_1.default.handle(i18next_1.default);
};
exports.i18nMiddleware = i18nMiddleware;
//# sourceMappingURL=i18n.js.map