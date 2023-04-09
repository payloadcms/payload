"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Tooltip_1 = __importDefault(require("../../elements/Tooltip"));
require("./index.scss");
const baseClass = 'field-error';
const Error = (props) => {
    const { showError = false, message, } = props;
    if (showError) {
        return (react_1.default.createElement(Tooltip_1.default, { className: baseClass, delay: 0 }, message));
    }
    return null;
};
exports.default = Error;
//# sourceMappingURL=index.js.map