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
const validations_1 = require("../../../../../fields/validations");
const Input_1 = __importDefault(require("./Input"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
require("./index.scss");
const Textarea = (props) => {
    const { path: pathFromProps, name, required, validate = validations_1.textarea, maxLength, minLength, admin: { readOnly, style, className, width, placeholder, rows, description, condition, } = {}, label, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const path = pathFromProps || name;
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        return validate(value, { ...options, required, maxLength, minLength });
    }, [validate, required, maxLength, minLength]);
    const { value, showError, setValue, errorMessage, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    return (react_1.default.createElement(Input_1.default, { path: path, name: name, onChange: (e) => {
            setValue(e.target.value);
        }, showError: showError, errorMessage: errorMessage, required: required, label: label, value: value, placeholder: (0, getTranslation_1.getTranslation)(placeholder, i18n), readOnly: readOnly, style: style, className: className, width: width, description: description, rows: rows }));
};
exports.default = (0, withCondition_1.default)(Textarea);
//# sourceMappingURL=index.js.map