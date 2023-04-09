"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Error_1 = __importDefault(require("../../Error"));
const Label_1 = __importDefault(require("../../Label"));
const FieldDescription_1 = __importDefault(require("../../FieldDescription"));
const RadioInput_1 = __importDefault(require("./RadioInput"));
const types_1 = require("../../../../../fields/config/types");
require("./index.scss");
const baseClass = 'radio-group';
const RadioGroupInput = (props) => {
    const { name, path: pathFromProps, required, label, readOnly, layout = 'horizontal', style, className, width, description, onChange, value, showError, errorMessage, options, } = props;
    const path = pathFromProps || name;
    const classes = [
        'field-type',
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        showError && 'error',
        readOnly && `${baseClass}--read-only`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement("div", { className: `${baseClass}__error-wrap` },
            react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage })),
        react_1.default.createElement(Label_1.default, { htmlFor: `field-${path}`, label: label, required: required }),
        react_1.default.createElement("ul", { id: `field-${path.replace(/\./gi, '__')}`, className: `${baseClass}--group` }, options.map((option) => {
            let optionValue = '';
            if ((0, types_1.optionIsObject)(option)) {
                optionValue = option.value;
            }
            else {
                optionValue = option;
            }
            const isSelected = String(optionValue) === String(value);
            return (react_1.default.createElement("li", { key: `${path} - ${optionValue}` },
                react_1.default.createElement(RadioInput_1.default, { path: path, isSelected: isSelected, option: (0, types_1.optionIsObject)(option) ? option : { label: option, value: option }, onChange: readOnly ? undefined : onChange })));
        })),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = RadioGroupInput;
//# sourceMappingURL=Input.js.map