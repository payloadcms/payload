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
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const Error_1 = __importDefault(require("../../Error"));
const validations_1 = require("../../../../../fields/validations");
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
const Input_1 = require("./Input");
require("./index.scss");
const baseClass = 'checkbox';
const Checkbox = (props) => {
    const { name, path: pathFromProps, validate = validations_1.checkbox, label, onChange, disableFormData, required, admin: { readOnly, style, className, width, description, condition, } = {}, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const path = pathFromProps || name;
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        return validate(value, { ...options, required });
    }, [validate, required]);
    const { value, showError, errorMessage, setValue, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        disableFormData,
        condition,
    });
    const onToggle = (0, react_1.useCallback)(() => {
        if (!readOnly) {
            setValue(!value);
            if (typeof onChange === 'function')
                onChange(!value);
        }
    }, [onChange, readOnly, setValue, value]);
    const fieldID = `field-${path.replace(/\./gi, '__')}`;
    return (react_1.default.createElement("div", { className: [
            'field-type',
            baseClass,
            showError && 'error',
            className,
            value && `${baseClass}--checked`,
            readOnly && `${baseClass}--read-only`,
        ].filter(Boolean).join(' '), style: {
            ...style,
            width,
        } },
        react_1.default.createElement("div", { className: `${baseClass}__error-wrap` },
            react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage })),
        react_1.default.createElement(Input_1.CheckboxInput, { onToggle: onToggle, id: fieldID, label: (0, getTranslation_1.getTranslation)(label || name, i18n), name: path, checked: Boolean(value) }),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = (0, withCondition_1.default)(Checkbox);
//# sourceMappingURL=index.js.map