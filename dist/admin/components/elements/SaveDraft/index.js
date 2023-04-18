"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Submit_1 = __importDefault(require("../../forms/Submit"));
const context_1 = require("../../forms/Form/context");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const Locale_1 = require("../../utilities/Locale");
require("./index.scss");
const baseClass = 'save-draft';
const SaveDraft = () => {
    const { serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { submit } = (0, context_1.useForm)();
    const { collection, global, id } = (0, DocumentInfo_1.useDocumentInfo)();
    const modified = (0, context_1.useFormModified)();
    const locale = (0, Locale_1.useLocale)();
    const { t } = (0, react_i18next_1.useTranslation)('version');
    const canSaveDraft = modified;
    const saveDraft = (0, react_1.useCallback)(() => {
        const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
        let action;
        let method = 'POST';
        if (collection) {
            action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`;
            if (id)
                method = 'PATCH';
        }
        if (global) {
            action = `${serverURL}${api}/globals/${global.slug}${search}`;
        }
        submit({
            action,
            method,
            skipValidation: true,
            overrides: {
                _status: 'draft',
            },
        });
    }, [submit, collection, global, serverURL, api, locale, id]);
    return (react_1.default.createElement(Submit_1.default, { className: baseClass, type: "button", buttonStyle: "secondary", onClick: saveDraft, disabled: !canSaveDraft }, t('saveDraft')));
};
exports.default = SaveDraft;
//# sourceMappingURL=index.js.map