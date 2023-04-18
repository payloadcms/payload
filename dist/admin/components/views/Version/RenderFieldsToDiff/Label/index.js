"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const baseClass = 'field-diff-label';
const Label = ({ children }) => (react_1.default.createElement("div", { className: baseClass }, children));
exports.default = Label;
//# sourceMappingURL=index.js.map