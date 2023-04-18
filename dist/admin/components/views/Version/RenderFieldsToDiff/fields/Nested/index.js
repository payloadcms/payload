"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const __1 = __importDefault(require("../.."));
const Label_1 = __importDefault(require("../../Label"));
const getTranslation_1 = require("../../../../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'nested-diff';
const Nested = ({ version, comparison, permissions, field, locale, locales, fieldComponents, disableGutter = false, }) => {
    const { i18n } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("div", { className: baseClass },
        field.label && (react_1.default.createElement(Label_1.default, null,
            locale && (react_1.default.createElement("span", { className: `${baseClass}__locale-label` }, locale)),
            (0, getTranslation_1.getTranslation)(field.label, i18n))),
        react_1.default.createElement("div", { className: [
                `${baseClass}__wrap`,
                !disableGutter && `${baseClass}__wrap--gutter`,
            ].filter(Boolean)
                .join(' ') },
            react_1.default.createElement(__1.default, { locales: locales, version: version, comparison: comparison, fieldPermissions: permissions, fields: field.fields, fieldComponents: fieldComponents }))));
};
exports.default = Nested;
//# sourceMappingURL=index.js.map