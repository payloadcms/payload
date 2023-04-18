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
const withCondition_1 = __importDefault(require("../../withCondition"));
const useField_1 = __importDefault(require("../../useField"));
const validations_1 = require("../../../../../fields/validations");
const Input_1 = __importDefault(require("./Input"));
const formatOptions = (options) => options.map((option) => {
    if (typeof option === 'object' && (option.value || option.value === '')) {
        return option;
    }
    return {
        label: option,
        value: option,
    };
});
const Select = (props) => {
    const { path: pathFromProps, name, validate = validations_1.select, label, options: optionsFromProps, hasMany, required, admin: { readOnly, style, className, width, description, isClearable, condition, isSortable = true, } = {}, } = props;
    const path = pathFromProps || name;
    const [options, setOptions] = (0, react_1.useState)(formatOptions(optionsFromProps));
    (0, react_1.useEffect)(() => {
        setOptions(formatOptions(optionsFromProps));
    }, [optionsFromProps]);
    const memoizedValidate = (0, react_1.useCallback)((value, validationOptions) => {
        return validate(value, { ...validationOptions, options, hasMany, required });
    }, [validate, required, hasMany, options]);
    const { value, showError, setValue, errorMessage, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    const onChange = (0, react_1.useCallback)((selectedOption) => {
        if (!readOnly) {
            let newValue;
            if (!selectedOption) {
                newValue = null;
            }
            else if (hasMany) {
                if (Array.isArray(selectedOption)) {
                    newValue = selectedOption.map((option) => option.value);
                }
                else {
                    newValue = [];
                }
            }
            else {
                newValue = selectedOption.value;
            }
            setValue(newValue);
        }
    }, [
        readOnly,
        hasMany,
        setValue,
    ]);
    return (react_1.default.createElement(Input_1.default, { path: path, onChange: onChange, value: value, name: name, options: options, label: label, showError: showError, errorMessage: errorMessage, required: required, readOnly: readOnly, description: description, style: style, className: className, width: width, hasMany: hasMany, isSortable: isSortable, isClearable: isClearable }));
};
exports.default = (0, withCondition_1.default)(Select);
//# sourceMappingURL=index.js.map