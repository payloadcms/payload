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
const react_toastify_1 = require("react-toastify");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const Button_1 = __importDefault(require("../Button"));
const __1 = require("../..");
const api_1 = require("../../../api");
const context_1 = require("../../forms/Form/context");
const Locale_1 = require("../../utilities/Locale");
require("./index.scss");
const baseClass = 'status';
const Status = () => {
    var _a, _b;
    const { publishedDoc, unpublishedVersions, collection, global, id, getVersions, } = (0, DocumentInfo_1.useDocumentInfo)();
    const { toggleModal } = (0, modal_1.useModal)();
    const { serverURL, routes: { api }, } = (0, Config_1.useConfig)();
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const { reset: resetForm } = (0, context_1.useForm)();
    const locale = (0, Locale_1.useLocale)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    const unPublishModalSlug = `confirm-un-publish-${id}`;
    const revertModalSlug = `confirm-revert-${id}`;
    let statusToRender;
    if (((_a = unpublishedVersions === null || unpublishedVersions === void 0 ? void 0 : unpublishedVersions.docs) === null || _a === void 0 ? void 0 : _a.length) > 0 && publishedDoc) {
        statusToRender = 'changed';
    }
    else if (!publishedDoc) {
        statusToRender = 'draft';
    }
    else if (publishedDoc && ((_b = unpublishedVersions === null || unpublishedVersions === void 0 ? void 0 : unpublishedVersions.docs) === null || _b === void 0 ? void 0 : _b.length) <= 1) {
        statusToRender = 'published';
    }
    const performAction = (0, react_1.useCallback)(async (action) => {
        let url;
        let method;
        let body;
        setProcessing(true);
        if (action === 'unpublish') {
            body = {
                _status: 'draft',
            };
        }
        if (action === 'revert') {
            body = publishedDoc;
        }
        if (collection) {
            url = `${serverURL}${api}/${collection.slug}/${id}?depth=0&locale=${locale}&fallback-locale=null`;
            method = 'patch';
        }
        if (global) {
            url = `${serverURL}${api}/globals/${global.slug}?depth=0&locale=${locale}&fallback-locale=null`;
            method = 'post';
        }
        const res = await api_1.requests[method](url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': i18n.language,
            },
            body: JSON.stringify(body),
        });
        if (res.status === 200) {
            let data;
            let fields;
            const json = await res.json();
            if (global) {
                data = json.result;
                fields = global.fields;
            }
            if (collection) {
                data = json.doc;
                fields = collection.fields;
            }
            resetForm(fields, data);
            react_toastify_1.toast.success(json.message);
            getVersions();
        }
        else {
            react_toastify_1.toast.error(t('error:unPublishingDocument'));
        }
        setProcessing(false);
        if (action === 'revert') {
            toggleModal(revertModalSlug);
        }
        if (action === 'unpublish') {
            toggleModal(unPublishModalSlug);
        }
    }, [collection, global, publishedDoc, serverURL, api, id, i18n, locale, resetForm, getVersions, t, toggleModal, revertModalSlug, unPublishModalSlug]);
    if (statusToRender) {
        return (react_1.default.createElement("div", { className: baseClass },
            react_1.default.createElement("div", { className: `${baseClass}__value-wrap` },
                react_1.default.createElement("span", { className: `${baseClass}__value` }, t(statusToRender)),
                statusToRender === 'published' && (react_1.default.createElement(react_1.default.Fragment, null,
                    "\u00A0\u2014\u00A0",
                    react_1.default.createElement(Button_1.default, { onClick: () => toggleModal(unPublishModalSlug), className: `${baseClass}__action`, buttonStyle: "none" }, t('unpublish')),
                    react_1.default.createElement(modal_1.Modal, { slug: unPublishModalSlug, className: `${baseClass}__modal` },
                        react_1.default.createElement(__1.MinimalTemplate, { className: `${baseClass}__modal-template` },
                            react_1.default.createElement("h1", null, t('confirmUnpublish')),
                            react_1.default.createElement("p", null, t('aboutToUnpublish')),
                            react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", type: "button", onClick: processing ? undefined : () => toggleModal(unPublishModalSlug) }, t('general:cancel')),
                            react_1.default.createElement(Button_1.default, { onClick: processing ? undefined : () => performAction('unpublish') }, t(processing ? 'unpublishing' : 'general:confirm')))))),
                statusToRender === 'changed' && (react_1.default.createElement(react_1.default.Fragment, null,
                    "\u00A0\u2014\u00A0",
                    react_1.default.createElement(Button_1.default, { onClick: () => toggleModal(revertModalSlug), className: `${baseClass}__action`, buttonStyle: "none" }, t('revertToPublished')),
                    react_1.default.createElement(modal_1.Modal, { slug: revertModalSlug, className: `${baseClass}__modal` },
                        react_1.default.createElement(__1.MinimalTemplate, { className: `${baseClass}__modal-template` },
                            react_1.default.createElement("h1", null, t('confirmRevertToSaved')),
                            react_1.default.createElement("p", null, t('aboutToRevertToPublished')),
                            react_1.default.createElement(Button_1.default, { buttonStyle: "secondary", type: "button", onClick: processing ? undefined : () => toggleModal(revertModalSlug) }, t('general:cancel')),
                            react_1.default.createElement(Button_1.default, { onClick: processing ? undefined : () => performAction('revert') }, t(processing ? 'reverting' : 'general:confirm')))))))));
    }
    return null;
};
exports.default = Status;
//# sourceMappingURL=index.js.map