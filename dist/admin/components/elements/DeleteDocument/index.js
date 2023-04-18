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
const react_router_dom_1 = require("react-router-dom");
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Button_1 = __importDefault(require("../Button"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const context_1 = require("../../forms/Form/context");
const useTitle_1 = __importDefault(require("../../../hooks/useTitle"));
const api_1 = require("../../../api");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'delete-document';
const DeleteDocument = (props) => {
    const { title: titleFromProps, id, buttonId, collection, collection: { slug, labels: { singular, } = {}, } = {}, } = props;
    const { serverURL, routes: { api, admin } } = (0, Config_1.useConfig)();
    const { setModified } = (0, context_1.useForm)();
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    const { toggleModal } = (0, modal_1.useModal)();
    const history = (0, react_router_dom_1.useHistory)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const title = (0, useTitle_1.default)(collection);
    const titleToRender = titleFromProps || title;
    const modalSlug = `delete-${id}`;
    const addDefaultError = (0, react_1.useCallback)(() => {
        react_toastify_1.toast.error(t('error:deletingTitle', { title }));
    }, [t, title]);
    const handleDelete = (0, react_1.useCallback)(() => {
        setDeleting(true);
        setModified(false);
        api_1.requests.delete(`${serverURL}${api}/${slug}/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': i18n.language,
            },
        }).then(async (res) => {
            try {
                const json = await res.json();
                if (res.status < 400) {
                    toggleModal(modalSlug);
                    react_toastify_1.toast.success(t('titleDeleted', { label: (0, getTranslation_1.getTranslation)(singular, i18n), title }));
                    return history.push(`${admin}/collections/${slug}`);
                }
                toggleModal(modalSlug);
                if (json.errors) {
                    json.errors.forEach((error) => react_toastify_1.toast.error(error.message));
                }
                else {
                    addDefaultError();
                }
                return false;
            }
            catch (e) {
                return addDefaultError();
            }
        });
    }, [setModified, serverURL, api, slug, id, toggleModal, modalSlug, t, singular, i18n, title, history, admin, addDefaultError]);
    if (id) {
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("button", { type: "button", id: buttonId, className: `${baseClass}__toggle`, onClick: (e) => {
                    e.preventDefault();
                    setDeleting(false);
                    toggleModal(modalSlug);
                } }, t('delete')),
            react_1.default.createElement(modal_1.Modal, { slug: modalSlug, className: baseClass },
                react_1.default.createElement(Minimal_1.default, { className: `${baseClass}__template` },
                    react_1.default.createElement("h1", null, t('confirmDeletion')),
                    react_1.default.createElement("p", null,
                        react_1.default.createElement(react_i18next_1.Trans, { i18nKey: "aboutToDelete", values: { label: (0, getTranslation_1.getTranslation)(singular, i18n), title: titleToRender }, t: t },
                            "aboutToDelete",
                            react_1.default.createElement("strong", null, titleToRender))),
                    react_1.default.createElement(Button_1.default, { id: "confirm-cancel", buttonStyle: "secondary", type: "button", onClick: deleting ? undefined : () => toggleModal(modalSlug) }, t('cancel')),
                    react_1.default.createElement(Button_1.default, { onClick: deleting ? undefined : handleDelete, id: "confirm-delete" }, deleting ? t('deleting') : t('confirm'))))));
    }
    return null;
};
exports.default = DeleteDocument;
//# sourceMappingURL=index.js.map