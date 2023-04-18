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
exports.ListDrawerContent = void 0;
const react_1 = __importStar(require("react"));
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const usePayloadAPI_1 = __importDefault(require("../../../hooks/usePayloadAPI"));
const Default_1 = __importDefault(require("../../views/collections/List/Default"));
const Label_1 = __importDefault(require("../../forms/Label"));
const ReactSelect_1 = __importDefault(require("../ReactSelect"));
const DocumentDrawer_1 = require("../DocumentDrawer");
const Pill_1 = __importDefault(require("../Pill"));
const X_1 = __importDefault(require("../../icons/X"));
const ViewDescription_1 = __importDefault(require("../ViewDescription"));
const formatFields_1 = __importDefault(require("../../views/collections/List/formatFields"));
const Preferences_1 = require("../../utilities/Preferences");
const _1 = require(".");
const TableColumns_1 = require("../TableColumns");
const ListDrawerContent = ({ drawerSlug, onSelect, customHeader, collectionSlugs, selectedCollection, filterOptions, }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { t, i18n } = (0, react_i18next_1.useTranslation)(['upload', 'general']);
    const { permissions } = (0, Auth_1.useAuth)();
    const { setPreference } = (0, Preferences_1.usePreferences)();
    const { isModalOpen, closeModal } = (0, modal_1.useModal)();
    const [limit, setLimit] = (0, react_1.useState)();
    const [sort, setSort] = (0, react_1.useState)(null);
    const [page, setPage] = (0, react_1.useState)(1);
    const [where, setWhere] = (0, react_1.useState)(null);
    const { serverURL, routes: { api }, collections } = (0, Config_1.useConfig)();
    const enabledCollectionConfigs = collections.filter(({ slug }) => {
        return collectionSlugs.includes(slug);
    });
    const [selectedCollectionConfig, setSelectedCollectionConfig] = (0, react_1.useState)(() => {
        return enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) || (enabledCollectionConfigs === null || enabledCollectionConfigs === void 0 ? void 0 : enabledCollectionConfigs[0]);
    });
    const [selectedOption, setSelectedOption] = (0, react_1.useState)(() => (selectedCollectionConfig ? { label: (0, getTranslation_1.getTranslation)(selectedCollectionConfig.labels.singular, i18n), value: selectedCollectionConfig.slug } : undefined));
    const [fields, setFields] = (0, react_1.useState)(() => (0, formatFields_1.default)(selectedCollectionConfig, t));
    (0, react_1.useEffect)(() => {
        setFields((0, formatFields_1.default)(selectedCollectionConfig, t));
    }, [selectedCollectionConfig, t]);
    // allow external control of selected collection, same as the initial state logic above
    (0, react_1.useEffect)(() => {
        if (selectedCollection) {
            // if passed a selection, find it and check if it's enabled
            const selectedConfig = enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) || (enabledCollectionConfigs === null || enabledCollectionConfigs === void 0 ? void 0 : enabledCollectionConfigs[0]);
            setSelectedCollectionConfig(selectedConfig);
        }
    }, [selectedCollection, enabledCollectionConfigs, onSelect, t]);
    const preferenceKey = `${selectedCollectionConfig.slug}-list`;
    // this is the 'create new' drawer
    const [DocumentDrawer, DocumentDrawerToggler, { drawerSlug: documentDrawerSlug, },] = (0, DocumentDrawer_1.useDocumentDrawer)({
        collectionSlug: selectedCollectionConfig.slug,
    });
    (0, react_1.useEffect)(() => {
        if (selectedOption) {
            setSelectedCollectionConfig(enabledCollectionConfigs.find(({ slug }) => selectedOption.value === slug));
        }
    }, [selectedOption, enabledCollectionConfigs]);
    const collectionPermissions = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[selectedCollectionConfig === null || selectedCollectionConfig === void 0 ? void 0 : selectedCollectionConfig.slug];
    const hasCreatePermission = (_b = collectionPermissions === null || collectionPermissions === void 0 ? void 0 : collectionPermissions.create) === null || _b === void 0 ? void 0 : _b.permission;
    // If modal is open, get active page of upload gallery
    const isOpen = isModalOpen(drawerSlug);
    const apiURL = isOpen ? `${serverURL}${api}/${selectedCollectionConfig.slug}` : null;
    const [cacheBust, dispatchCacheBust] = (0, react_1.useReducer)((state) => state + 1, 0); // used to force a re-fetch even when apiURL is unchanged
    const [{ data, isError }, { setParams }] = (0, usePayloadAPI_1.default)(apiURL, {});
    const moreThanOneAvailableCollection = enabledCollectionConfigs.length > 1;
    (0, react_1.useEffect)(() => {
        const params = {};
        if (page)
            params.page = page;
        params.where = {
            ...where ? { ...where } : {},
            ...(filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions[selectedCollectionConfig.slug]) ? {
                ...filterOptions[selectedCollectionConfig.slug],
            } : {},
        };
        if (sort)
            params.sort = sort;
        if (limit)
            params.limit = limit;
        if (cacheBust)
            params.cacheBust = cacheBust;
        setParams(params);
    }, [setParams, page, sort, where, limit, cacheBust, filterOptions, selectedCollectionConfig]);
    (0, react_1.useEffect)(() => {
        const newPreferences = {
            limit,
            sort,
        };
        setPreference(preferenceKey, newPreferences);
    }, [sort, limit, setPreference, preferenceKey]);
    const onCreateNew = (0, react_1.useCallback)(({ doc }) => {
        if (typeof onSelect === 'function') {
            onSelect({
                docID: doc.id,
                collectionConfig: selectedCollectionConfig,
            });
        }
        dispatchCacheBust();
        closeModal(documentDrawerSlug);
        closeModal(drawerSlug);
    }, [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedCollectionConfig]);
    if (!selectedCollectionConfig || isError) {
        return null;
    }
    return (react_1.default.createElement(TableColumns_1.TableColumnsProvider, { collection: selectedCollectionConfig, cellProps: [{
                link: false,
                onClick: ({ collection: rowColl, rowData }) => {
                    if (typeof onSelect === 'function') {
                        onSelect({
                            docID: rowData.id,
                            collectionConfig: rowColl,
                        });
                    }
                },
                className: `${_1.baseClass}__first-cell`,
            }] },
        react_1.default.createElement(DocumentInfo_1.DocumentInfoProvider, { collection: selectedCollectionConfig },
            react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Default_1.default, CustomComponent: (_e = (_d = (_c = selectedCollectionConfig === null || selectedCollectionConfig === void 0 ? void 0 : selectedCollectionConfig.admin) === null || _c === void 0 ? void 0 : _c.components) === null || _d === void 0 ? void 0 : _d.views) === null || _e === void 0 ? void 0 : _e.List, componentProps: {
                    collection: {
                        ...selectedCollectionConfig,
                        fields,
                    },
                    customHeader: (react_1.default.createElement("header", { className: `${_1.baseClass}__header` },
                        react_1.default.createElement("div", { className: `${_1.baseClass}__header-wrap` },
                            react_1.default.createElement("div", { className: `${_1.baseClass}__header-content` },
                                react_1.default.createElement("h2", { className: `${_1.baseClass}__header-text` }, !customHeader ? (0, getTranslation_1.getTranslation)((_f = selectedCollectionConfig === null || selectedCollectionConfig === void 0 ? void 0 : selectedCollectionConfig.labels) === null || _f === void 0 ? void 0 : _f.plural, i18n) : customHeader),
                                hasCreatePermission && (react_1.default.createElement(DocumentDrawerToggler, { className: `${_1.baseClass}__create-new-button` },
                                    react_1.default.createElement(Pill_1.default, null, t('general:createNew'))))),
                            react_1.default.createElement("button", { type: "button", onClick: () => {
                                    closeModal(drawerSlug);
                                }, className: `${_1.baseClass}__header-close` },
                                react_1.default.createElement(X_1.default, null))),
                        ((_g = selectedCollectionConfig === null || selectedCollectionConfig === void 0 ? void 0 : selectedCollectionConfig.admin) === null || _g === void 0 ? void 0 : _g.description) && (react_1.default.createElement("div", { className: `${_1.baseClass}__sub-header` },
                            react_1.default.createElement(ViewDescription_1.default, { description: selectedCollectionConfig.admin.description }))),
                        moreThanOneAvailableCollection && (react_1.default.createElement("div", { className: `${_1.baseClass}__select-collection-wrap` },
                            react_1.default.createElement(Label_1.default, { label: t('selectCollectionToBrowse') }),
                            react_1.default.createElement(ReactSelect_1.default, { className: `${_1.baseClass}__select-collection`, value: selectedOption, onChange: setSelectedOption, options: enabledCollectionConfigs.map((coll) => ({ label: (0, getTranslation_1.getTranslation)(coll.labels.singular, i18n), value: coll.slug })) }))))),
                    data,
                    limit: limit || ((_j = (_h = selectedCollectionConfig === null || selectedCollectionConfig === void 0 ? void 0 : selectedCollectionConfig.admin) === null || _h === void 0 ? void 0 : _h.pagination) === null || _j === void 0 ? void 0 : _j.defaultLimit),
                    setLimit,
                    setSort,
                    newDocumentURL: null,
                    hasCreatePermission,
                    disableEyebrow: true,
                    modifySearchParams: false,
                    handleSortChange: setSort,
                    handleWhereChange: setWhere,
                    handlePageChange: setPage,
                    handlePerPageChange: setLimit,
                } })),
        react_1.default.createElement(DocumentDrawer, { onSave: onCreateNew })));
};
exports.ListDrawerContent = ListDrawerContent;
//# sourceMappingURL=DrawerContent.js.map