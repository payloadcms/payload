"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'radio-input';
const RadioInput = (props) => {
    const { isSelected, option, onChange, path } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const classes = [
        baseClass,
        isSelected && `${baseClass}--is-selected`,
    ].filter(Boolean).join(' ');
    const id = `field-${path}-${option.value}`;
    return (react_1.default.createElement("label", { htmlFor: id },
        react_1.default.createElement("div", { className: classes },
            react_1.default.createElement("input", { id: id, type: "radio", checked: isSelected, onChange: () => (typeof onChange === 'function' ? onChange(option.value) : null) }),
            react_1.default.createElement("span", { className: `${baseClass}__styled-radio` }),
            react_1.default.createElement("span", { className: `${baseClass}__label` }, (0, getTranslation_1.getTranslation)(option.label, i18n)))));
};
exports.default = RadioInput;
//# sourceMappingURL=index.js.map