"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const ReactSelect_1 = __importDefault(require("../../../elements/ReactSelect"));
require("./index.scss");
const baseClass = 'select-version-locales';
const SelectLocales = ({ onChange, value, options }) => {
    const { t } = (0, react_i18next_1.useTranslation)('version');
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("div", { className: `${baseClass}__label` }, t('showLocales')),
        react_1.default.createElement(ReactSelect_1.default, { isMulti: true, placeholder: t('selectLocales'), onChange: onChange, value: value, options: options })));
};
exports.default = SelectLocales;
//# sourceMappingURL=index.js.map