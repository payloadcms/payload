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
const Error_1 = __importDefault(require("../../Error"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const validations_1 = require("../../../../../fields/validations");
const Label_1 = __importDefault(require("../../Label"));
const useField_1 = __importDefault(require("../../useField"));
const withCondition_1 = __importDefault(require("../../withCondition"));
const CodeEditor_1 = __importDefault(require("../../../elements/CodeEditor"));
require("./index.scss");
const baseClass = 'json-field';
const JSONField = (props) => {
    const { path: pathFromProps, name, required, validate = validations_1.json, admin: { readOnly, style, className, width, description, condition, editorOptions, } = {}, label, } = props;
    const path = pathFromProps || name;
    const [stringValue, setStringValue] = (0, react_1.useState)();
    const [jsonError, setJsonError] = (0, react_1.useState)();
    const memoizedValidate = (0, react_1.useCallback)((value, options) => {
        return validate(value, { ...options, required, jsonError });
    }, [validate, required, jsonError]);
    const { value, initialValue, showError, setValue, errorMessage, } = (0, useField_1.default)({
        path,
        validate: memoizedValidate,
        condition,
    });
    const handleChange = (0, react_1.useCallback)((val) => {
        if (readOnly)
            return;
        setStringValue(val);
        try {
            setValue(JSON.parse(val.trim() || '{}'));
            setJsonError(undefined);
        }
        catch (e) {
            setJsonError(e);
        }
    }, [readOnly, setValue, setStringValue]);
    (0, react_1.useEffect)(() => {
        setStringValue(JSON.stringify(initialValue, null, 2));
    }, [initialValue]);
    const classes = [
        baseClass,
        'field-type',
        className,
        showError && 'error',
        readOnly && 'read-only',
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        react_1.default.createElement(Label_1.default, { htmlFor: `field-${path}`, label: label, required: required }),
        react_1.default.createElement(CodeEditor_1.default, { options: editorOptions, defaultLanguage: "json", value: stringValue, onChange: handleChange, readOnly: readOnly }),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = (0, withCondition_1.default)(JSONField);
//# sourceMappingURL=JSON.js.map