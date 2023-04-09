"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
require("./index.scss");
const baseClass = 'condition-value-text';
const Text = ({ onChange, value }) => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    return (react_1.default.createElement("input", { placeholder: t('enterAValue'), className: baseClass, type: "text", onChange: (e) => onChange(e.target.value), value: value || '' }));
};
exports.default = Text;
//# sourceMappingURL=index.js.map