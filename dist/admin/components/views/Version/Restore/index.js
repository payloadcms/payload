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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_toastify_1 = require("react-toastify");
const modal_1 = require("@faceless-ui/modal");
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../utilities/Config");
const __1 = require("../../..");
const api_1 = require("../../../../api");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'restore-version';
const modalSlug = 'restore-version';
const Restore = ({ collection, global, className, versionID, originalDocID, versionDate }) => {
    const { serverURL, routes: { api, admin } } = (0, Config_1.useConfig)();
    const history = (0, react_router_dom_1.useHistory)();
    const { toggleModal } = (0, modal_1.useModal)();
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    let fetchURL = `${serverURL}${api}`;
    let redirectURL;
    let restoreMessage;
    if (collection) {
        fetchURL = `${fetchURL}/${collection.slug}/versions/${versionID}`;
        redirectURL = `${admin}/collections/${collection.slug}/${originalDocID}`;
        restoreMessage = t('aboutToRestore', { label: (0, getTranslation_1.getTranslation)(collection.labels.singular, i18n), versionDate });
    }
    if (global) {
        fetchURL = `${fetchURL}/globals/${global.slug}/versions/${versionID}`;
        redirectURL = `${admin}/globals/${global.slug}`;
        restoreMessage = t('aboutToRestoreGlobal', { label: (0, getTranslation_1.getTranslation)(global.label, i18n), versionDate });
    }
    const handleRestore = (0, react_1.useCallback)(async () => {
        setProcessing(true);
        const res = await api_1.requests.post(fetchURL, {
            headers: {
                'Accept-Language': i18n.language,
            },
        });
        if (res.status === 200) {
            const json = await res.json();
            react_toastify_1.toast.success(json.message);
            history.push(redirectURL);
        }
        else {
            react_toastify_1.toast.error(t('problemRestoringVersion'));
        }
    }, [fetchURL, history, redirectURL, t, i18n]);
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(__1.Pill, { onClick: () => toggleModal(modalSlug), className: [baseClass, className].filter(Boolean).join(' ') }, t('restoreThisVersion')),
        react_1.default.createElement(modal_1.Modal, { slug: modalSlug, className: `${baseClass}__modal` },
            react_1.default.createElement(__1.MinimalTemplate, { className: `${baseClass}__modal-template` },
                react_1.default.createElement("h1", null, t('confirmVersionRestoration')),
                react_1.default.createElement("p", null, restoreMessage),
                react_1.default.createElement(__1.Button, { buttonStyle: "secondary", type: "button", onClick: processing ? undefined : () => toggleModal(modalSlug) }, t('general:cancel')),
                react_1.default.createElement(__1.Button, { onClick: processing ? undefined : handleRestore }, processing ? t('restoring') : t('general:confirm'))))));
};
exports.default = Restore;
//# sourceMappingURL=index.js.map