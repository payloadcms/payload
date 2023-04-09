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
exports.FieldSelect = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const types_1 = require("../../../../fields/config/types");
const ReactSelect_1 = __importDefault(require("../ReactSelect"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Label_1 = __importDefault(require("../../forms/Label"));
const context_1 = require("../../forms/Form/context");
const createNestedFieldPath_1 = require("../../forms/Form/createNestedFieldPath");
require("./index.scss");
const baseClass = 'field-select';
const combineLabel = (prefix, field, i18n) => (`${prefix === '' ? '' : `${prefix} > `}${(0, getTranslation_1.getTranslation)(field.label || field.name, i18n) || ''}`);
const reduceFields = (fields, i18n, path = '', labelPrefix = '') => (fields.reduce((fieldsToUse, field) => {
    var _a, _b, _c;
    // escape for a variety of reasons
    if ((0, types_1.fieldAffectsData)(field) && (((_a = field.admin) === null || _a === void 0 ? void 0 : _a.disableBulkEdit) || field.unique || field.hidden || ((_b = field.admin) === null || _b === void 0 ? void 0 : _b.hidden) || ((_c = field.admin) === null || _c === void 0 ? void 0 : _c.readOnly))) {
        return fieldsToUse;
    }
    if (!(field.type === 'array' || field.type === 'blocks') && (0, types_1.fieldHasSubFields)(field)) {
        return [
            ...fieldsToUse,
            ...reduceFields(field.fields, i18n, (0, createNestedFieldPath_1.createNestedFieldPath)(path, field), combineLabel(labelPrefix, field, i18n)),
        ];
    }
    if (field.type === 'tabs') {
        return [
            ...fieldsToUse,
            ...field.tabs.reduce((tabFields, tab) => {
                return [
                    ...tabFields,
                    ...(reduceFields(tab.fields, i18n, (0, types_1.tabHasName)(tab) ? (0, createNestedFieldPath_1.createNestedFieldPath)(path, field) : path, combineLabel(labelPrefix, field, i18n))),
                ];
            }, []),
        ];
    }
    const formattedField = {
        label: combineLabel(labelPrefix, field, i18n),
        value: {
            ...field,
            path: (0, createNestedFieldPath_1.createNestedFieldPath)(path, field),
        },
    };
    return [
        ...fieldsToUse,
        formattedField,
    ];
}, []));
const FieldSelect = ({ fields, setSelected, }) => {
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    const [options] = (0, react_1.useState)(() => reduceFields(fields, i18n));
    const { getFields, dispatchFields } = (0, context_1.useForm)();
    const handleChange = (selected) => {
        const activeFields = getFields();
        if (selected === null) {
            setSelected([]);
        }
        else {
            setSelected(selected.map(({ value }) => value));
        }
        // remove deselected values from form state
        if (selected === null || Object.keys(activeFields).length > selected.length) {
            Object.keys(activeFields).forEach((path) => {
                if (selected === null || !selected.find((field) => {
                    return field.value.path === path;
                })) {
                    dispatchFields({
                        type: 'REMOVE',
                        path,
                    });
                }
            });
        }
    };
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement(Label_1.default, { label: t('fields:selectFieldsToEdit') }),
        react_1.default.createElement(ReactSelect_1.default, { options: options, isMulti: true, onChange: handleChange })));
};
exports.FieldSelect = FieldSelect;
//# sourceMappingURL=index.js.map