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
const RadioGroup = (props) => {
    const { name, path: pathFromProps, required, validate = validations_1.radio, label, admin: { readOnly, layout = 'horizontal', style, className, width, description, condition, } = {}, options, } = props;
    const path = pathFromProps || name;
    const memoizedValidate = (0, react_1.useCallback)((value, validationOptions) => {
        return validate(value, { ...validationOptions, options, required });
    }, [validate, options, required]);
    const { value, showError, errorMessage, setValue, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    return (react_1.default.createElement(Input_1.default, { path: path, name: name, onChange: readOnly ? undefined : setValue, value: value, showError: showError, errorMessage: errorMessage, required: required, label: label, layout: layout, style: style, className: className, width: width, description: description, options: options }));
};
exports.default = (0, withCondition_1.default)(RadioGroup);
//# sourceMappingURL=index.js.map