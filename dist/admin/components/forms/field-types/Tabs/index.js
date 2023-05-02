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
const RenderFields_1 = __importDefault(require("../../RenderFields"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const types_1 = require("../../../../../fields/config/types");
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const toKebabCase_1 = __importDefault(require("../../../../../utilities/toKebabCase"));
const provider_1 = require("../../../elements/Collapsible/provider");
const provider_2 = require("./provider");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const Preferences_1 = require("../../../utilities/Preferences");
const DocumentInfo_1 = require("../../../utilities/DocumentInfo");
const createNestedFieldPath_1 = require("../../Form/createNestedFieldPath");
require("./index.scss");
const baseClass = 'tabs-field';
const TabsField = (props) => {
    const { tabs, fieldTypes, path, permissions, indexPath, admin: { readOnly, className, }, } = props;
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const { preferencesKey } = (0, DocumentInfo_1.useDocumentInfo)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const isWithinCollapsible = (0, provider_1.useCollapsible)();
    const [activeTabIndex, setActiveTabIndex] = (0, react_1.useState)(0);
    const tabsPrefKey = `tabs-${indexPath}`;
    (0, react_1.useEffect)(() => {
        const getInitialPref = async () => {
            var _a, _b, _c, _d;
            const existingPreferences = await getPreference(preferencesKey);
            const initialIndex = path ? (_b = (_a = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _a === void 0 ? void 0 : _a[path]) === null || _b === void 0 ? void 0 : _b.tabIndex : (_d = (_c = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _c === void 0 ? void 0 : _c[tabsPrefKey]) === null || _d === void 0 ? void 0 : _d.tabIndex;
            setActiveTabIndex(initialIndex || 0);
        };
        getInitialPref();
    }, [path, indexPath, getPreference, preferencesKey, tabsPrefKey]);
    const handleTabChange = (0, react_1.useCallback)(async (incomingTabIndex) => {
        var _a, _b;
        setActiveTabIndex(incomingTabIndex);
        const existingPreferences = await getPreference(preferencesKey);
        setPreference(preferencesKey, {
            ...existingPreferences,
            ...path ? {
                fields: {
                    ...(existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) || {},
                    [path]: {
                        ...(_a = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _a === void 0 ? void 0 : _a[path],
                        tabIndex: incomingTabIndex,
                    },
                },
            } : {
                fields: {
                    ...existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields,
                    [tabsPrefKey]: {
                        ...(_b = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _b === void 0 ? void 0 : _b[tabsPrefKey],
                        tabIndex: incomingTabIndex,
                    },
                },
            },
        });
    }, [preferencesKey, getPreference, setPreference, path, tabsPrefKey]);
    const activeTabConfig = tabs[activeTabIndex];
    return (react_1.default.createElement("div", { className: [
            className,
            baseClass,
            isWithinCollapsible && `${baseClass}--within-collapsible`,
        ].filter(Boolean).join(' ') },
        react_1.default.createElement(provider_2.TabsProvider, null,
            react_1.default.createElement("div", { className: `${baseClass}__tabs-wrap` },
                react_1.default.createElement("div", { className: `${baseClass}__tabs` }, tabs.map((tab, tabIndex) => {
                    return (react_1.default.createElement("button", { key: tabIndex, type: "button", className: [
                            `${baseClass}__tab-button`,
                            activeTabIndex === tabIndex && `${baseClass}__tab-button--active`,
                        ].filter(Boolean).join(' '), onClick: () => {
                            handleTabChange(tabIndex);
                        } }, tab.label ? (0, getTranslation_1.getTranslation)(tab.label, i18n) : ((0, types_1.tabHasName)(tab) && tab.name)));
                }))),
            react_1.default.createElement("div", { className: `${baseClass}__content-wrap` }, activeTabConfig && (react_1.default.createElement("div", { className: [
                    `${baseClass}__tab`,
                    activeTabConfig.label && `${baseClass}__tab-${(0, toKebabCase_1.default)((0, getTranslation_1.getTranslation)(activeTabConfig.label, i18n))}`,
                ].filter(Boolean).join(' ') },
                react_1.default.createElement(FieldDescription_1.default, { className: `${baseClass}__description`, description: activeTabConfig.description }),
                react_1.default.createElement(RenderFields_1.default, { key: String(activeTabConfig.label), forceRender: true, readOnly: readOnly, permissions: (0, types_1.tabHasName)(activeTabConfig) ? permissions[activeTabConfig.name].fields : permissions, fieldTypes: fieldTypes, fieldSchema: activeTabConfig.fields.map((field) => {
                        const pathSegments = [];
                        if (path)
                            pathSegments.push(path);
                        if ((0, types_1.tabHasName)(activeTabConfig))
                            pathSegments.push(activeTabConfig.name);
                        return {
                            ...field,
                            path: (0, createNestedFieldPath_1.createNestedFieldPath)(pathSegments.join('.'), field),
                        };
                    }), indexPath: indexPath })))))));
};
exports.default = (0, withCondition_1.default)(TabsField);
//# sourceMappingURL=index.js.map