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
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const validations_1 = require("../../../../../fields/validations");
const Input_1 = __importDefault(require("./Input"));
const Text = (props) => {
    const { path: pathFromProps, name, required, validate = validations_1.text, label, minLength, maxLength, admin: { placeholder, readOnly, style, className, width, description, condition, } = {}, inputRef, } = props;
    const path = pathFromProps || name;
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        return validate(value, { ...options, minLength, maxLength, required });
    }, [validate, minLength, maxLength, required]);
    const field = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    const { value, showError, setValue, errorMessage, } = field;
    return (react_1.default.createElement(Input_1.default, { path: path, name: name, onChange: (e) => {
            setValue(e.target.value);
        }, showError: showError, errorMessage: errorMessage, required: required, label: label, value: value, placeholder: placeholder, readOnly: readOnly, style: style, className: className, width: width, description: description, inputRef: inputRef }));
};
exports.default = (0, withCondition_1.default)(Text);
//# sourceMappingURL=index.js.map