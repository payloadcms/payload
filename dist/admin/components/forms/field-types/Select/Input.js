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
const ReactSelect_1 = __importDefault(require("../../../elements/ReactSelect"));
const getTranslation_1 = require("../../../../../utilities/getTranslation");
require("./index.scss");
const SelectInput = (props) => {
    var _a;
    const { showError, errorMessage, readOnly, path, label, required, value, onChange, description, style, className, width, options, hasMany, isSortable, isClearable, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const classes = [
        'field-type',
        'select',
        className,
        showError && 'error',
        readOnly && 'read-only',
    ].filter(Boolean).join(' ');
    let valueToRender;
    if (hasMany && Array.isArray(value)) {
        valueToRender = value.map((val) => {
            var _a;
            const matchingOption = options.find((option) => option.value === val);
            return {
                label: matchingOption ? (0, getTranslation_1.getTranslation)(matchingOption.label, i18n) : val,
                value: (_a = matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.value) !== null && _a !== void 0 ? _a : val,
            };
        });
    }
    else if (value) {
        const matchingOption = options.find((option) => option.value === value);
        valueToRender = {
            label: matchingOption ? (0, getTranslation_1.getTranslation)(matchingOption.label, i18n) : value,
            value: (_a = matchingOption === null || matchingOption === void 0 ? void 0 : matchingOption.value) !== null && _a !== void 0 ? _a : value,
        };
    }
    return (react_1.default.createElement("div", { id: `field-${path.replace(/\./gi, '__')}`, className: classes, style: {
            ...style,
            width,
        } },
        react_1.default.createElement(Error_1.default, { showError: showError, message: errorMessage }),
        react_1.default.createElement(Label_1.default, { htmlFor: `field-${path.replace(/\./gi, '__')}`, label: label, required: required }),
        react_1.default.createElement(ReactSelect_1.default, { onChange: onChange, value: valueToRender, showError: showError, isDisabled: readOnly, options: options.map((option) => ({ ...option, label: (0, getTranslation_1.getTranslation)(option.label, i18n) })), isMulti: hasMany, isSortable: isSortable, isClearable: isClearable }),
        react_1.default.createElement(FieldDescription_1.default, { value: value, description: description })));
};
exports.default = SelectInput;
//# sourceMappingURL=Input.js.map