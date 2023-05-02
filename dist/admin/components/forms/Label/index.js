"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../utilities/getTranslation");
require("./index.scss");
const Label = (props) => {
    const { label, required = false, htmlFor, } = props;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    if (label) {
        return (react_1.default.createElement("label", { htmlFor: htmlFor, className: "field-label" },
            (0, getTranslation_1.getTranslation)(label, i18n),
            required && react_1.default.createElement("span", { className: "required" }, "*")));
    }
    return null;
};
exports.default = Label;
//# sourceMappingURL=index.js.map