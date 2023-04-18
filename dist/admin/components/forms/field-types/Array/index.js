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
const Auth_1 = require("../../../utilities/Auth");
const withCondition_1 = __importDefault(require("../../withCondition"));
const Button_1 = __importDefault(require("../../../elements/Button"));
const rowReducer_1 = __importDefault(require("../rowReducer"));
const context_1 = require("../../Form/context");
const buildStateFromSchema_1 = __importDefault(require("../../Form/buildStateFromSchema"));
const useField_1 = __importDefault(require("../../useField"));
const Locale_1 = require("../../../utilities/Locale");
const Error_1 = __importDefault(require("../../Error"));
const validations_1 = require("../../../../../fields/validations");
const Banner_1 = __importDefault(require("../../../elements/Banner"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const DocumentInfo_1 = require("../../../utilities/DocumentInfo");
const OperationProvider_1 = require("../../../utilities/OperationProvider");
const Collapsible_1 = require("../../../elements/Collapsible");
const RenderFields_1 = __importDefault(require("../../RenderFields"));
const Preferences_1 = require("../../../utilities/Preferences");
const ArrayAction_1 = require("../../../elements/ArrayAction");
const scrollToID_1 = require("../../../../utilities/scrollToID");
const HiddenInput_1 = __importDefault(require("../HiddenInput"));
const RowLabel_1 = require("../../RowLabel");
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const createNestedFieldPath_1 = require("../../Form/createNestedFieldPath");
const Config_1 = require("../../../utilities/Config");
const NullifyField_1 = require("../../NullifyField");
const DraggableSortable_1 = __importDefault(require("../../../elements/DraggableSortable"));
const DraggableSortableItem_1 = __importDefault(require("../../../elements/DraggableSortable/DraggableSortableItem"));
require("./index.scss");
const baseClass = 'array-field';
const ArrayFieldType = (props) => {
    var _a, _b;
    const { name, path: pathFromProps, fields, fieldTypes, validate = validations_1.array, required, maxRows, minRows, permissions, indexPath, localized, admin: { readOnly, description, condition, initCollapsed, className, components, }, } = props;
    const path = pathFromProps || name;
    // eslint-disable-next-line react/destructuring-assignment
    const label = (_a = props === null || props === void 0 ? void 0 : props.label) !== null && _a !== void 0 ? _a : (_b = props === null || props === void 0 ? void 0 : props.labels) === null || _b === void 0 ? void 0 : _b.singular;
    const CustomRowLabel = (components === null || components === void 0 ? void 0 : components.RowLabel) || undefined;
    const { preferencesKey } = (0, DocumentInfo_1.useDocumentInfo)();
    const { getPreference } = (0, Preferences_1.usePreferences)();
    const { setPreference } = (0, Preferences_1.usePreferences)();
    const [rows, dispatchRows] = (0, react_1.useReducer)(rowReducer_1.default, undefined);
    const formContext = (0, context_1.useForm)();
    const { user } = (0, Auth_1.useAuth)();
    const { id } = (0, DocumentInfo_1.useDocumentInfo)();
    const locale = (0, Locale_1.useLocale)();
    const operation = (0, OperationProvider_1.useOperation)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('fields');
    const { localization } = (0, Config_1.useConfig)();
    const checkSkipValidation = (0, react_1.useCallback)((value) => {
        const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
        const isEditingDefaultLocale = locale === defaultLocale;
        const fallbackEnabled = (localization && localization.fallback);
        if (value === null && !isEditingDefaultLocale && fallbackEnabled)
            return true;
        return false;
    }, [locale, localization]);
    // Handle labeling for Arrays, Global Arrays, and Blocks
    const getLabels = (p) => {
        if (p === null || p === void 0 ? void 0 : p.labels)
            return p.labels;
        if (p === null || p === void 0 ? void 0 : p.label)
            return { singular: p.label, plural: undefined };
        return { singular: t('row'), plural: t('rows') };
    };
    const labels = getLabels(props);
    const { dispatchFields, setModified } = formContext;
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        if (checkSkipValidation(value))
            return true;
        return validate(value, { ...options, minRows, maxRows, required });
    }, [maxRows, minRows, required, validate, checkSkipValidation]);
    const { showError, errorMessage, value, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
        disableFormData: (rows === null || rows === void 0 ? void 0 : rows.length) > 0,
    });
    const addRow = (0, react_1.useCallback)(async (rowIndex) => {
        const subFieldState = await (0, buildStateFromSchema_1.default)({ fieldSchema: fields, operation, id, user, locale, t });
        dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path });
        dispatchRows({ type: 'ADD', rowIndex });
        setModified(true);
        setTimeout(() => {
            (0, scrollToID_1.scrollToID)(`${path}-row-${rowIndex + 1}`);
        }, 0);
    }, [dispatchRows, dispatchFields, fields, path, operation, id, user, locale, setModified, t]);
    const duplicateRow = (0, react_1.useCallback)(async (rowIndex) => {
        dispatchFields({ type: 'DUPLICATE_ROW', rowIndex, path });
        dispatchRows({ type: 'ADD', rowIndex });
        setModified(true);
        setTimeout(() => {
            (0, scrollToID_1.scrollToID)(`${path}-row-${rowIndex + 1}`);
        }, 0);
    }, [dispatchRows, dispatchFields, path, setModified]);
    const removeRow = (0, react_1.useCallback)((rowIndex) => {
        dispatchRows({ type: 'REMOVE', rowIndex });
        dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
        setModified(true);
    }, [dispatchRows, dispatchFields, path, setModified]);
    const moveRow = (0, react_1.useCallback)((moveFromIndex, moveToIndex) => {
        dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
        dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
        setModified(true);
    }, [dispatchRows, dispatchFields, path, setModified]);
    const setCollapse = (0, react_1.useCallback)(async (rowID, collapsed) => {
        var _a, _b, _c;
        dispatchRows({ type: 'SET_COLLAPSE', id: rowID, collapsed });
        if (preferencesKey) {
            const preferencesToSet = (await getPreference(preferencesKey)) || { fields: {} };
            let newCollapsedState = (_b = (_a = preferencesToSet === null || preferencesToSet === void 0 ? void 0 : preferencesToSet.fields) === null || _a === void 0 ? void 0 : _a[path]) === null || _b === void 0 ? void 0 : _b.collapsed;
            if (initCollapsed && typeof newCollapsedState === 'undefined') {
                newCollapsedState = rows.map((row) => row.id);
            }
            else if (typeof newCollapsedState === 'undefined') {
                newCollapsedState = [];
            }
            if (!collapsed) {
                newCollapsedState = newCollapsedState.filter((existingID) => existingID !== rowID);
            }
            else {
                newCollapsedState.push(rowID);
            }
            setPreference(preferencesKey, {
                ...preferencesToSet,
                fields: {
                    ...((preferencesToSet === null || preferencesToSet === void 0 ? void 0 : preferencesToSet.fields) || {}),
                    [path]: {
                        ...(_c = preferencesToSet === null || preferencesToSet === void 0 ? void 0 : preferencesToSet.fields) === null || _c === void 0 ? void 0 : _c[path],
                        collapsed: newCollapsedState,
                    },
                },
            });
        }
    }, [preferencesKey, getPreference, path, setPreference, initCollapsed, rows]);
    const toggleCollapseAll = (0, react_1.useCallback)(async (collapse) => {
        var _a;
        dispatchRows({ type: 'SET_ALL_COLLAPSED', collapse });
        if (preferencesKey) {
            const preferencesToSet = await getPreference(preferencesKey) || { fields: {} };
            setPreference(preferencesKey, {
                ...preferencesToSet,
                fields: {
                    ...(preferencesToSet === null || preferencesToSet === void 0 ? void 0 : preferencesToSet.fields) || {},
                    [path]: {
                        ...(_a = preferencesToSet === null || preferencesToSet === void 0 ? void 0 : preferencesToSet.fields) === null || _a === void 0 ? void 0 : _a[path],
                        collapsed: collapse ? rows.map(({ id: rowID }) => rowID) : [],
                    },
                },
            });
        }
    }, [path, getPreference, preferencesKey, rows, setPreference]);
    (0, react_1.useEffect)(() => {
        const initializeRowState = async () => {
            var _a, _b;
            const data = formContext.getDataByPath(path);
            const preferences = (await getPreference(preferencesKey)) || { fields: {} };
            dispatchRows({ type: 'SET_ALL', data: data || [], collapsedState: (_b = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.fields) === null || _a === void 0 ? void 0 : _a[path]) === null || _b === void 0 ? void 0 : _b.collapsed, initCollapsed });
        };
        initializeRowState();
    }, [formContext, path, getPreference, preferencesKey, initCollapsed]);
    const hasMaxRows = maxRows && (rows === null || rows === void 0 ? void 0 : rows.length) >= maxRows;
    const classes = [
        'field-type',
        baseClass,
        className,
    ].filter(Boolean).join(' ');
    if (!rows)
        return null;
    return (react_1.default.createElement("div", { id: `field-${path.replace(/\./gi, '__')}`, className: classes },
        react_1.default.createElement("div", { className: `${baseClass}__error-wrap` },
            react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage })),
        react_1.default.createElement("header", { className: `${baseClass}__header` },
            react_1.default.createElement("div", { className: `${baseClass}__header-wrap` },
                react_1.default.createElement("h3", null, (0, getTranslation_1.getTranslation)(label || name, i18n)),
                react_1.default.createElement("ul", { className: `${baseClass}__header-actions` },
                    react_1.default.createElement("li", null,
                        react_1.default.createElement("button", { type: "button", onClick: () => toggleCollapseAll(true), className: `${baseClass}__header-action` }, t('collapseAll'))),
                    react_1.default.createElement("li", null,
                        react_1.default.createElement("button", { type: "button", onClick: () => toggleCollapseAll(false), className: `${baseClass}__header-action` }, t('showAll'))))),
            react_1.default.createElement(FieldDescription_1.default, { className: `field-description-${path.replace(/\./gi, '__')}`, value: value, description: description })),
        react_1.default.createElement(NullifyField_1.NullifyLocaleField, { localized: localized, path: path, fieldValue: value }),
        react_1.default.createElement(DraggableSortable_1.default, { ids: rows.map((row) => row.id), onDragEnd: ({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex) },
            rows.length > 0 && rows.map((row, i) => {
                const rowNumber = i + 1;
                const fallbackLabel = `${(0, getTranslation_1.getTranslation)(labels.singular, i18n)} ${String(rowNumber).padStart(2, '0')}`;
                return (react_1.default.createElement(DraggableSortableItem_1.default, { key: row.id, id: row.id, disabled: readOnly }, ({ setNodeRef, transform, attributes, listeners }) => (react_1.default.createElement("div", { id: `${path}-row-${i}`, key: `${path}-row-${i}`, ref: setNodeRef, style: {
                        transform,
                    } },
                    react_1.default.createElement(Collapsible_1.Collapsible, { collapsed: row.collapsed, onToggle: (collapsed) => setCollapse(row.id, collapsed), className: `${baseClass}__row`, key: row.id, dragHandleProps: {
                            id: row.id,
                            attributes,
                            listeners,
                        }, header: (react_1.default.createElement(RowLabel_1.RowLabel, { path: `${path}.${i}`, label: CustomRowLabel || fallbackLabel, rowNumber: rowNumber })), actions: !readOnly ? (react_1.default.createElement(ArrayAction_1.ArrayAction, { rowCount: rows.length, duplicateRow: duplicateRow, addRow: addRow, moveRow: moveRow, removeRow: removeRow, index: i })) : undefined },
                        react_1.default.createElement(HiddenInput_1.default, { name: `${path}.${i}.id`, value: row.id }),
                        react_1.default.createElement(RenderFields_1.default, { className: `${baseClass}__fields`, readOnly: readOnly, fieldTypes: fieldTypes, permissions: permissions === null || permissions === void 0 ? void 0 : permissions.fields, indexPath: indexPath, fieldSchema: fields.map((field) => ({
                                ...field,
                                path: (0, createNestedFieldPath_1.createNestedFieldPath)(`${path}.${i}`, field),
                            })) }))))));
            }),
            !checkSkipValidation(value) && (react_1.default.createElement(react_1.default.Fragment, null,
                (rows.length < minRows || (required && rows.length === 0)) && (react_1.default.createElement(Banner_1.default, { type: "error" }, t('validation:requiresAtLeast', {
                    count: minRows,
                    label: (0, getTranslation_1.getTranslation)(minRows ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? 'general:row' : 'general:rows'),
                }))),
                (rows.length === 0 && readOnly) && (react_1.default.createElement(Banner_1.default, null, t('validation:fieldHasNo', { label: (0, getTranslation_1.getTranslation)(labels.plural, i18n) })))))),
        (!readOnly && !hasMaxRows) && (react_1.default.createElement("div", { className: `${baseClass}__add-button-wrap` },
            react_1.default.createElement(Button_1.default, { onClick: () => addRow(value), buttonStyle: "icon-label", icon: "plus", iconStyle: "with-border", iconPosition: "left" }, t('addLabel', { label: (0, getTranslation_1.getTranslation)(labels.singular, i18n) }))))));
};
exports.default = (0, withCondition_1.default)(ArrayFieldType);
//# sourceMappingURL=index.js.map