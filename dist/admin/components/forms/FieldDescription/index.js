"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const types_1 = require("./types");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const baseClass = 'field-description';
const FieldDescription = (props) => {
    const { className, description, value, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    if ((0, types_1.isComponent)(description)) {
        const Description = description;
        return react_1.default.createElement(Description, { value: value });
    }
    if (description) {
        return (react_1.default.createElement("div", { className: [
                baseClass,
                className,
            ].filter(Boolean).join(' ') }, typeof description === 'function' ? description({ value }) : (0, getTranslation_1.getTranslation)(description, i18n)));
    }
    return null;
};
exports.default = FieldDescription;
//# sourceMappingURL=index.js.map