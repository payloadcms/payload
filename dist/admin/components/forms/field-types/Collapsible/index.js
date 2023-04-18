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
const RenderFields_1 = __importDefault(require("../../RenderFields"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const Collapsible_1 = require("../../../elements/Collapsible");
const Preferences_1 = require("../../../utilities/Preferences");
const DocumentInfo_1 = require("../../../utilities/DocumentInfo");
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const RowLabel_1 = require("../../RowLabel");
const createNestedFieldPath_1 = require("../../Form/createNestedFieldPath");
require("./index.scss");
const baseClass = 'collapsible-field';
const CollapsibleField = (props) => {
    const { label, fields, fieldTypes, path, permissions, indexPath, admin: { readOnly, className, initCollapsed, description, }, } = props;
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const { preferencesKey } = (0, DocumentInfo_1.useDocumentInfo)();
    const [collapsedOnMount, setCollapsedOnMount] = (0, react_1.useState)();
    const fieldPreferencesKey = `collapsible-${indexPath.replace(/\./gi, '__')}`;
    const onToggle = (0, react_1.useCallback)(async (newCollapsedState) => {
        var _a, _b;
        const existingPreferences = await getPreference(preferencesKey);
        setPreference(preferencesKey, {
            ...existingPreferences,
            ...path ? {
                fields: {
                    ...(existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) || {},
                    [path]: {
                        ...(_a = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _a === void 0 ? void 0 : _a[path],
                        collapsed: newCollapsedState,
                    },
                },
            } : {
                fields: {
                    ...(existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) || {},
                    [fieldPreferencesKey]: {
                        ...(_b = existingPreferences === null || existingPreferences === void 0 ? void 0 : existingPreferences.fields) === null || _b === void 0 ? void 0 : _b[fieldPreferencesKey],
                        collapsed: newCollapsedState,
                    },
                },
            },
        });
    }, [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path]);
    (0, react_1.useEffect)(() => {
        const fetchInitialState = async () => {
            var _a, _b, _c, _d;
            const preferences = await getPreference(preferencesKey);
            if (preferences) {
                const initCollapsedFromPref = path ? (_b = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.fields) === null || _a === void 0 ? void 0 : _a[path]) === null || _b === void 0 ? void 0 : _b.collapsed : (_d = (_c = preferences === null || preferences === void 0 ? void 0 : preferences.fields) === null || _c === void 0 ? void 0 : _c[fieldPreferencesKey]) === null || _d === void 0 ? void 0 : _d.collapsed;
                setCollapsedOnMount(Boolean(initCollapsedFromPref));
            }
            else {
                setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false);
            }
        };
        fetchInitialState();
    }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path]);
    if (typeof collapsedOnMount !== 'boolean')
        return null;
    return (react_1.default.createElement("div", { id: `field-${fieldPreferencesKey}${path ? `-${path.replace(/\./gi, '__')}` : ''}` },
        react_1.default.createElement(Collapsible_1.Collapsible, { initCollapsed: collapsedOnMount, className: [
                'field-type',
                baseClass,
                className,
            ].filter(Boolean).join(' '), header: (react_1.default.createElement(RowLabel_1.RowLabel, { path: path, label: label })), onToggle: onToggle },
            react_1.default.createElement(RenderFields_1.default, { forceRender: true, readOnly: readOnly, permissions: permissions, fieldTypes: fieldTypes, indexPath: indexPath, fieldSchema: fields.map((field) => ({
                    ...field,
                    path: (0, createNestedFieldPath_1.createNestedFieldPath)(path, field),
                })) })),
        react_1.default.createElement(FieldDescription_1.default, { description: description })));
};
exports.default = (0, withCondition_1.default)(CollapsibleField);
//# sourceMappingURL=index.js.map