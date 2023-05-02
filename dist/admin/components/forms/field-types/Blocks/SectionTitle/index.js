"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const useField_1 = __importDefault(require("../../../useField"));
require("./index.scss");
const baseClass = 'section-title';
const SectionTitle = (props) => {
    const { path, readOnly } = props;
    const { value, setValue } = (0, useField_1.default)({ path });
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const classes = [
        baseClass,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("div", { className: classes, "data-value": value },
        react_1.default.createElement("input", { className: `${baseClass}__input`, id: path, value: value || '', placeholder: t('untitled'), type: "text", name: path, onChange: (e) => {
                e.stopPropagation();
                e.preventDefault();
                setValue(e.target.value);
            }, readOnly: readOnly })));
};
exports.default = SectionTitle;
//# sourceMappingURL=index.js.map