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
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const DocumentInfo_1 = require("../../utilities/DocumentInfo");
const usePayloadAPI_1 = __importDefault(require("../../../hooks/usePayloadAPI"));
const Eyebrow_1 = __importDefault(require("../../elements/Eyebrow"));
const StepNav_1 = require("../../elements/StepNav");
const Meta_1 = __importDefault(require("../../utilities/Meta"));
const Compare_1 = __importDefault(require("./Compare"));
const shared_1 = require("./shared");
const Restore_1 = __importDefault(require("./Restore"));
const SelectLocales_1 = __importDefault(require("./SelectLocales"));
const RenderFieldsToDiff_1 = __importDefault(require("./RenderFieldsToDiff"));
const fields_1 = __importDefault(require("./RenderFieldsToDiff/fields"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
const types_1 = require("../../../../fields/config/types");
const Locale_1 = require("../../utilities/Locale");
const Gutter_1 = require("../../elements/Gutter");
const formatDate_1 = require("../../../utilities/formatDate");
require("./index.scss");
const baseClass = 'view-version';
const VersionView = ({ collection, global }) => {
    var _a, _b;
    const { serverURL, routes: { admin, api }, admin: { dateFormat }, localization } = (0, Config_1.useConfig)();
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const { params: { id, versionID } } = (0, react_router_dom_1.useRouteMatch)();
    const [compareValue, setCompareValue] = (0, react_1.useState)(shared_1.mostRecentVersionOption);
    const [localeOptions] = (0, react_1.useState)(() => (localization ? localization.locales.map((locale) => ({ label: locale, value: locale })) : []));
    const [locales, setLocales] = (0, react_1.useState)(localeOptions);
    const { permissions } = (0, Auth_1.useAuth)();
    const locale = (0, Locale_1.useLocale)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('version');
    const { docPermissions } = (0, DocumentInfo_1.useDocumentInfo)();
    let originalDocFetchURL;
    let versionFetchURL;
    let entityLabel;
    let fields;
    let fieldPermissions;
    let compareBaseURL;
    let slug;
    let parentID;
    if (collection) {
        ({ slug } = collection);
        originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`;
        versionFetchURL = `${serverURL}${api}/${slug}/versions/${versionID}`;
        compareBaseURL = `${serverURL}${api}/${slug}/versions`;
        entityLabel = (0, getTranslation_1.getTranslation)(collection.labels.singular, i18n);
        parentID = id;
        fields = collection.fields;
        fieldPermissions = permissions.collections[collection.slug].fields;
    }
    if (global) {
        ({ slug } = global);
        originalDocFetchURL = `${serverURL}${api}/globals/${slug}`;
        versionFetchURL = `${serverURL}${api}/globals/${slug}/versions/${versionID}`;
        compareBaseURL = `${serverURL}${api}/globals/${slug}/versions`;
        entityLabel = (0, getTranslation_1.getTranslation)(global.label, i18n);
        fields = global.fields;
        fieldPermissions = permissions.globals[global.slug].fields;
    }
    const compareFetchURL = (compareValue === null || compareValue === void 0 ? void 0 : compareValue.value) === 'mostRecent' || (compareValue === null || compareValue === void 0 ? void 0 : compareValue.value) === 'published' ? originalDocFetchURL : `${compareBaseURL}/${compareValue.value}`;
    const [{ data: doc, isLoading: isLoadingData }] = (0, usePayloadAPI_1.default)(versionFetchURL, { initialParams: { locale: '*', depth: 1 } });
    const [{ data: publishedDoc }] = (0, usePayloadAPI_1.default)(originalDocFetchURL, { initialParams: { locale: '*', depth: 1 } });
    const [{ data: mostRecentDoc }] = (0, usePayloadAPI_1.default)(originalDocFetchURL, { initialParams: { locale: '*', depth: 1, draft: true } });
    const [{ data: compareDoc }] = (0, usePayloadAPI_1.default)(compareFetchURL, { initialParams: { locale: '*', depth: 1, draft: 'true' } });
    (0, react_1.useEffect)(() => {
        var _a;
        let nav = [];
        if (collection) {
            let docLabel = '';
            if (mostRecentDoc) {
                const { useAsTitle } = collection.admin;
                if (useAsTitle !== 'id') {
                    const titleField = collection.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === useAsTitle);
                    if (titleField && mostRecentDoc[useAsTitle]) {
                        if (titleField.localized) {
                            docLabel = (_a = mostRecentDoc[useAsTitle]) === null || _a === void 0 ? void 0 : _a[locale];
                        }
                        else {
                            docLabel = mostRecentDoc[useAsTitle];
                        }
                    }
                    else {
                        docLabel = `[${t('general:untitled')}]`;
                    }
                }
                else {
                    docLabel = mostRecentDoc.id;
                }
            }
            nav = [
                {
                    url: `${admin}/collections/${collection.slug}`,
                    label: (0, getTranslation_1.getTranslation)(collection.labels.plural, i18n),
                },
                {
                    label: docLabel,
                    url: `${admin}/collections/${collection.slug}/${id}`,
                },
                {
                    label: 'Versions',
                    url: `${admin}/collections/${collection.slug}/${id}/versions`,
                },
                {
                    label: (doc === null || doc === void 0 ? void 0 : doc.createdAt) ? (0, formatDate_1.formatDate)(doc.createdAt, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language) : '',
                },
            ];
        }
        if (global) {
            nav = [
                {
                    url: `${admin}/globals/${global.slug}`,
                    label: global.label,
                },
                {
                    label: 'Versions',
                    url: `${admin}/globals/${global.slug}/versions`,
                },
                {
                    label: (doc === null || doc === void 0 ? void 0 : doc.createdAt) ? (0, formatDate_1.formatDate)(doc.createdAt, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language) : '',
                },
            ];
        }
        setStepNav(nav);
    }, [setStepNav, collection, global, dateFormat, doc, mostRecentDoc, admin, id, locale, t, i18n]);
    let metaTitle;
    let metaDesc;
    const formattedCreatedAt = (doc === null || doc === void 0 ? void 0 : doc.createdAt) ? (0, formatDate_1.formatDate)(doc.createdAt, dateFormat, i18n === null || i18n === void 0 ? void 0 : i18n.language) : '';
    if (collection) {
        const useAsTitle = ((_a = collection === null || collection === void 0 ? void 0 : collection.admin) === null || _a === void 0 ? void 0 : _a.useAsTitle) || 'id';
        metaTitle = `${t('version')} - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`;
        metaDesc = t('viewingVersion', { documentTitle: doc[useAsTitle], entityLabel });
    }
    if (global) {
        metaTitle = `${t('version')} - ${formattedCreatedAt} - ${entityLabel}`;
        metaDesc = t('viewingVersionGlobal', { entityLabel });
    }
    let comparison = compareDoc === null || compareDoc === void 0 ? void 0 : compareDoc.version;
    if ((compareValue === null || compareValue === void 0 ? void 0 : compareValue.value) === 'mostRecent') {
        comparison = mostRecentDoc;
    }
    if ((compareValue === null || compareValue === void 0 ? void 0 : compareValue.value) === 'published') {
        comparison = publishedDoc;
    }
    const canUpdate = (_b = docPermissions === null || docPermissions === void 0 ? void 0 : docPermissions.update) === null || _b === void 0 ? void 0 : _b.permission;
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: baseClass },
            react_1.default.createElement(Meta_1.default, { title: metaTitle, description: metaDesc }),
            react_1.default.createElement(Eyebrow_1.default, null),
            react_1.default.createElement(Gutter_1.Gutter, { className: `${baseClass}__wrap` },
                react_1.default.createElement("div", { className: `${baseClass}__intro` }, t('versionCreatedOn', { version: t((doc === null || doc === void 0 ? void 0 : doc.autosave) ? 'autosavedVersion' : 'version') })),
                react_1.default.createElement("header", { className: `${baseClass}__header` },
                    react_1.default.createElement("h2", null, formattedCreatedAt),
                    canUpdate && (react_1.default.createElement(Restore_1.default, { className: `${baseClass}__restore`, collection: collection, global: global, originalDocID: id, versionID: versionID, versionDate: formattedCreatedAt }))),
                react_1.default.createElement("div", { className: `${baseClass}__controls` },
                    react_1.default.createElement(Compare_1.default, { publishedDoc: publishedDoc, versionID: versionID, baseURL: compareBaseURL, parentID: parentID, value: compareValue, onChange: setCompareValue }),
                    localization && (react_1.default.createElement(SelectLocales_1.default, { onChange: setLocales, options: localeOptions, value: locales }))),
                (doc === null || doc === void 0 ? void 0 : doc.version) && (react_1.default.createElement(RenderFieldsToDiff_1.default, { locales: locales ? locales.map(({ value }) => value) : [], fields: fields, fieldComponents: fields_1.default, fieldPermissions: fieldPermissions, version: doc === null || doc === void 0 ? void 0 : doc.version, comparison: comparison }))))));
};
exports.default = VersionView;
//# sourceMappingURL=Version.js.map