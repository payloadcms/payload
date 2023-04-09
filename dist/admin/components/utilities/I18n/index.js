"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
const i18next_1 = __importDefault(require("i18next"));
const react_1 = require("@monaco-editor/react");
const i18next_browser_languagedetector_1 = __importDefault(require("i18next-browser-languagedetector"));
const react_i18next_1 = require("react-i18next");
const deepmerge_1 = __importDefault(require("deepmerge"));
const defaultOptions_1 = require("../../../../translations/defaultOptions");
const Config_1 = require("../Config");
const getSupportedMonacoLocale_1 = require("../../../utilities/getSupportedMonacoLocale");
const I18n = () => {
    const config = (0, Config_1.useConfig)();
    if (i18next_1.default.isInitialized) {
        return null;
    }
    i18next_1.default
        .use(i18next_browser_languagedetector_1.default)
        .use(react_i18next_1.initReactI18next)
        .init((0, deepmerge_1.default)(defaultOptions_1.defaultOptions, config.i18n || {}));
    react_1.loader.config({ 'vs/nls': { availableLanguages: { '*': (0, getSupportedMonacoLocale_1.getSupportedMonacoLocale)(i18next_1.default.language) } } });
    return null;
};
exports.I18n = I18n;
exports.default = exports.I18n;
//# sourceMappingURL=index.js.map