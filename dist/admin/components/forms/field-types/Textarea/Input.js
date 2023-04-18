"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const Label_1 = __importDefault(require("../../Label"));
const Error_1 = __importDefault(require("../../Error"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
require("./index.scss");
const TextareaInput = (props) => {
    const { path, required, readOnly, style, className, width, placeholder, description, label, showError, value, errorMessage, onChange, rows, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const classes = [
        'field-type',
        'textarea',
        className,
        showError && 'error',
        readOnly && 'read-only',
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        react_1.default.createElement(Label_1.default, { htmlFor: `field-${path.replace(/\./gi, '__')}`, label: label, required: required }),
        react_1.default.createElement("label", { className: "textarea-outer", htmlFor: `field-${path.replace(/\./gi, '__')}` },
            react_1.default.createElement("div", { className: "textarea-inner" },
                react_1.default.createElement("div", { className: "textarea-clone", "data-value": value || placeholder || '' }),
                react_1.default.createElement("textarea", { className: "textarea-element", id: `field-${path.replace(/\./gi, '__')}`, value: value || '', onChange: onChange, disabled: readOnly, placeholder: (0, getTranslation_1.getTranslation)(placeholder, i18n), name: path, rows: rows }))),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = TextareaInput;
//# sourceMappingURL=Input.js.map