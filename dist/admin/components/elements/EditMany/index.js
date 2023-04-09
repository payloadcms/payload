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
const modal_1 = require("@faceless-ui/modal");
const Config_1 = require("../../utilities/Config");
const Drawer_1 = require("../Drawer");
const SelectionProvider_1 = require("../../views/collections/List/SelectionProvider");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Auth_1 = require("../../utilities/Auth");
const FieldSelect_1 = require("../FieldSelect");
const Submit_1 = __importDefault(require("../../forms/Submit"));
const Form_1 = __importDefault(require("../../forms/Form"));
const context_1 = require("../../forms/Form/context");
const RenderFields_1 = __importDefault(require("../../forms/RenderFields"));
const OperationProvider_1 = require("../../utilities/OperationProvider");
const field_types_1 = __importDefault(require("../../forms/field-types"));
const X_1 = __importDefault(require("../../icons/X"));
require("./index.scss");
const baseClass = 'edit-many';
const Submit = ({ action, disabled }) => {
    const { submit } = (0, context_1.useForm)();
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const save = (0, react_1.useCallback)(() => {
        submit({
            skipValidation: true,
            method: 'PATCH',
            action,
        });
    }, [action, submit]);
    return (react_1.default.createElement(Submit_1.default, { className: `${baseClass}__save`, onClick: save, disabled: disabled }, t('save')));
};
const Publish = ({ action, disabled }) => {
    const { submit } = (0, context_1.useForm)();
    const { t } = (0, react_i18next_1.useTranslation)('version');
    const save = (0, react_1.useCallback)(() => {
        submit({
            skipValidation: true,
            method: 'PATCH',
            overrides: {
                _status: 'published',
            },
            action,
        });
    }, [action, submit]);
    return (react_1.default.createElement(Submit_1.default, { className: `${baseClass}__publish`, onClick: save, disabled: disabled }, t('publishChanges')));
};
const SaveDraft = ({ action, disabled }) => {
    const { submit } = (0, context_1.useForm)();
    const { t } = (0, react_i18next_1.useTranslation)('version');
    const save = (0, react_1.useCallback)(() => {
        submit({
            skipValidation: true,
            method: 'PATCH',
            overrides: {
                _status: 'draft',
            },
            action,
        });
    }, [action, submit]);
    return (react_1.default.createElement(Submit_1.default, { className: `${baseClass}__draft`, onClick: save, disabled: disabled }, t('saveDraft')));
};
const EditMany = (props) => {
    var _a, _b;
    const { resetParams, collection, collection: { slug, labels: { plural, }, fields, } = {}, } = props;
    const { permissions } = (0, Auth_1.useAuth)();
    const { closeModal } = (0, modal_1.useModal)();
    const { serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { selectAll, count, getQueryParams } = (0, SelectionProvider_1.useSelection)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [selected, setSelected] = (0, react_1.useState)([]);
    const collectionPermissions = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[slug];
    const hasUpdatePermission = (_b = collectionPermissions === null || collectionPermissions === void 0 ? void 0 : collectionPermissions.update) === null || _b === void 0 ? void 0 : _b.permission;
    const drawerSlug = `edit-${slug}`;
    if (selectAll === SelectionProvider_1.SelectAllStatus.None || !hasUpdatePermission) {
        return null;
    }
    const onSuccess = () => {
        resetParams({ page: selectAll === SelectionProvider_1.SelectAllStatus.AllAvailable ? 1 : undefined });
    };
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Drawer_1.DrawerToggler, { slug: drawerSlug, className: `${baseClass}__toggle`, "aria-label": t('edit'), onClick: () => {
                setSelected([]);
            } }, t('edit')),
        react_1.default.createElement(Drawer_1.Drawer, { slug: drawerSlug, header: null },
            react_1.default.createElement(OperationProvider_1.OperationContext.Provider, { value: "update" },
                react_1.default.createElement(Form_1.default, { className: `${baseClass}__form`, onSuccess: onSuccess },
                    react_1.default.createElement("div", { className: `${baseClass}__main` },
                        react_1.default.createElement("div", { className: `${baseClass}__header` },
                            react_1.default.createElement("h2", { className: `${baseClass}__header__title` }, t('editingLabel', { label: (0, getTranslation_1.getTranslation)(plural, i18n), count })),
                            react_1.default.createElement("button", { className: `${baseClass}__header__close`, id: `close-drawer__${drawerSlug}`, type: "button", onClick: () => closeModal(drawerSlug), "aria-label": t('close') },
                                react_1.default.createElement(X_1.default, null))),
                        react_1.default.createElement(FieldSelect_1.FieldSelect, { fields: fields, setSelected: setSelected }),
                        react_1.default.createElement(RenderFields_1.default, { fieldTypes: field_types_1.default, fieldSchema: selected }),
                        react_1.default.createElement("div", { className: `${baseClass}__sidebar-wrap` },
                            react_1.default.createElement("div", { className: `${baseClass}__sidebar` },
                                react_1.default.createElement("div", { className: `${baseClass}__sidebar-sticky-wrap` },
                                    react_1.default.createElement("div", { className: `${baseClass}__document-actions` },
                                        react_1.default.createElement(Submit, { action: `${serverURL}${api}/${slug}${getQueryParams()}`, disabled: selected.length === 0 }),
                                        collection.versions && (react_1.default.createElement(react_1.default.Fragment, null,
                                            react_1.default.createElement(Publish, { action: `${serverURL}${api}/${slug}${getQueryParams()}`, disabled: selected.length === 0 }),
                                            react_1.default.createElement(SaveDraft, { action: `${serverURL}${api}/${slug}${getQueryParams()}`, disabled: selected.length === 0 })))))))))))));
};
exports.default = EditMany;
//# sourceMappingURL=index.js.map