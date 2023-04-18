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
const Button_1 = __importDefault(require("../Button"));
const Minimal_1 = __importDefault(require("../../templates/Minimal"));
const api_1 = require("../../../api");
const SelectionProvider_1 = require("../../views/collections/List/SelectionProvider");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Pill_1 = __importDefault(require("../Pill"));
const Auth_1 = require("../../utilities/Auth");
require("./index.scss");
const baseClass = 'delete-documents';
const DeleteMany = (props) => {
    var _a, _b;
    const { resetParams, collection: { slug, labels: { plural, }, } = {}, } = props;
    const { permissions } = (0, Auth_1.useAuth)();
    const { serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { toggleModal } = (0, modal_1.useModal)();
    const { selectAll, count, getQueryParams, toggleAll } = (0, SelectionProvider_1.useSelection)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    const collectionPermissions = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[slug];
    const hasDeletePermission = (_b = collectionPermissions === null || collectionPermissions === void 0 ? void 0 : collectionPermissions.delete) === null || _b === void 0 ? void 0 : _b.permission;
    const modalSlug = `delete-${slug}`;
    const addDefaultError = (0, react_1.useCallback)(() => {
        react_toastify_1.toast.error(t('error:unknown'));
    }, [t]);
    const handleDelete = (0, react_1.useCallback)(() => {
        setDeleting(true);
        api_1.requests.delete(`${serverURL}${api}/${slug}${getQueryParams()}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': i18n.language,
            },
        }).then(async (res) => {
            try {
                const json = await res.json();
                toggleModal(modalSlug);
                if (res.status < 400) {
                    react_toastify_1.toast.success(json.message || t('deletedSuccessfully'), { autoClose: 3000 });
                    toggleAll();
                    resetParams({ page: selectAll ? 1 : undefined });
                    return null;
                }
                if (json.errors) {
                    react_toastify_1.toast.error(json.message);
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
    }, [addDefaultError, api, getQueryParams, i18n.language, modalSlug, resetParams, selectAll, serverURL, slug, t, toggleAll, toggleModal]);
    if (selectAll === SelectionProvider_1.SelectAllStatus.None || !hasDeletePermission) {
        return null;
    }
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Pill_1.default, { className: `${baseClass}__toggle`, onClick: () => {
                setDeleting(false);
                toggleModal(modalSlug);
            } }, t('delete')),
        react_1.default.createElement(modal_1.Modal, { slug: modalSlug, className: baseClass },
            react_1.default.createElement(Minimal_1.default, { className: `${baseClass}__template` },
                react_1.default.createElement("h1", null, t('confirmDeletion')),
                react_1.default.createElement("p", null, t('aboutToDeleteCount', { label: (0, getTranslation_1.getTranslation)(plural, i18n), count })),
                react_1.default.createElement(Button_1.default, { id: "confirm-cancel", buttonStyle: "secondary", type: "button", onClick: deleting ? undefined : () => toggleModal(modalSlug) }, t('cancel')),
                react_1.default.createElement(Button_1.default, { onClick: deleting ? undefined : handleDelete, id: "confirm-delete" }, deleting ? t('deleting') : t('confirm'))))));
};
exports.default = DeleteMany;
//# sourceMappingURL=index.js.map