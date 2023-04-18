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
exports.DocumentDrawerContent = void 0;
const react_1 = __importStar(require("react"));
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const react_toastify_1 = require("react-toastify");
const Default_1 = __importDefault(require("../../views/collections/Edit/Default"));
const X_1 = __importDefault(require("../../icons/X"));
const buildStateFromSchema_1 = __importDefault(require("../../forms/Form/buildStateFromSchema"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Button_1 = __importDefault(require("../Button"));
const Config_1 = require("../../utilities/Config");
const Locale_1 = require("../../utilities/Locale");
const Auth_1 = require("../../utilities/Auth");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const usePayloadAPI_1 = __importDefault(require("../../../hooks/usePayloadAPI"));
const formatFields_1 = __importDefault(require("../../views/collections/Edit/formatFields"));
const useRelatedCollections_1 = require("../../forms/field-types/Relationship/AddNew/useRelatedCollections");
const IDLabel_1 = __importDefault(require("../IDLabel"));
const _1 = require(".");
const DocumentDrawerContent = ({ collectionSlug, id, drawerSlug, onSave: onSaveFromProps, customHeader, }) => {
    var _a, _b, _c;
    const { serverURL, routes: { api } } = (0, Config_1.useConfig)();
    const { toggleModal, modalState, closeModal } = (0, modal_1.useModal)();
    const locale = (0, Locale_1.useLocale)();
    const { permissions, user } = (0, Auth_1.useAuth)();
    const [internalState, setInternalState] = (0, react_1.useState)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)(['fields', 'general']);
    const hasInitializedState = (0, react_1.useRef)(false);
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [collectionConfig] = (0, useRelatedCollections_1.useRelatedCollections)(collectionSlug);
    const [fields, setFields] = (0, react_1.useState)(() => (0, formatFields_1.default)(collectionConfig, true));
    (0, react_1.useEffect)(() => {
        setFields((0, formatFields_1.default)(collectionConfig, true));
    }, [collectionSlug, collectionConfig]);
    const [{ data, isLoading: isLoadingDocument, isError }] = (0, usePayloadAPI_1.default)((id ? `${serverURL}${api}/${collectionSlug}/${id}` : null), { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } });
    (0, react_1.useEffect)(() => {
        if (isLoadingDocument) {
            return;
        }
        const awaitInitialState = async () => {
            const state = await (0, buildStateFromSchema_1.default)({
                fieldSchema: fields,
                data,
                user,
                operation: id ? 'update' : 'create',
                id,
                locale,
                t,
            });
            setInternalState(state);
        };
        awaitInitialState();
        hasInitializedState.current = true;
    }, [data, fields, id, user, locale, isLoadingDocument, t]);
    (0, react_1.useEffect)(() => {
        var _a;
        setIsOpen(Boolean((_a = modalState[drawerSlug]) === null || _a === void 0 ? void 0 : _a.isOpen));
    }, [modalState, drawerSlug]);
    (0, react_1.useEffect)(() => {
        var _a;
        if (isOpen && !isLoadingDocument && isError) {
            closeModal(drawerSlug);
            react_toastify_1.toast.error(((_a = data.errors) === null || _a === void 0 ? void 0 : _a[0].message) || t('error:unspecific'));
        }
    }, [isError, t, isOpen, data, drawerSlug, closeModal, isLoadingDocument]);
    const onSave = (0, react_1.useCallback)((args) => {
        if (typeof onSaveFromProps === 'function') {
            onSaveFromProps({
                ...args,
                collectionConfig,
            });
        }
    }, [collectionConfig, onSaveFromProps]);
    if (isError)
        return null;
    return (react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { collection: collectionConfig, id: id },
        react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Default_1.default, CustomComponent: (_c = (_b = (_a = collectionConfig.admin) === null || _a === void 0 ? void 0 : _a.components) === null || _b === void 0 ? void 0 : _b.views) === null || _c === void 0 ? void 0 : _c.Edit, componentProps: {
                isLoading: !internalState,
                data,
                id,
                collection: collectionConfig,
                permissions: permissions.collections[collectionConfig.slug],
                isEditing: Boolean(id),
                apiURL: id ? `${serverURL}${api}/${collectionSlug}/${id}` : null,
                onSave,
                internalState,
                hasSavePermission: true,
                action: `${serverURL}${api}/${collectionSlug}${id ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`,
                disableEyebrow: true,
                disableActions: true,
                me: true,
                disableLeaveWithoutSaving: true,
                customHeader: (react_1.default.createElement("div", { className: `${_1.baseClass}__header` },
                    react_1.default.createElement("div", { className: `${_1.baseClass}__header-content` },
                        react_1.default.createElement("h2", { className: `${_1.baseClass}__header-text` }, !customHeader ? t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: (0, getTranslation_1.getTranslation)(collectionConfig.labels.singular, i18n) }) : customHeader),
                        react_1.default.createElement(Button_1.default, { buttonStyle: "none", className: `${_1.baseClass}__header-close`, onClick: () => toggleModal(drawerSlug), "aria-label": t('general:close') },
                            react_1.default.createElement(X_1.default, null))),
                    id && (react_1.default.createElement(IDLabel_1.default, { id: id })))),
            } })));
};
exports.DocumentDrawerContent = DocumentDrawerContent;
//# sourceMappingURL=DrawerContent.js.map