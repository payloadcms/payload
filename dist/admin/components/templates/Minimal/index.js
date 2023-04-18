"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const baseClass = 'template-minimal';
const Minimal = (props) => {
    const { className, style = {}, children, width = 'normal', } = props;
    const classes = [
        className,
        baseClass,
        `${baseClass}--width-${width}`,
    ].filter(Boolean).join(' ');
    return (react_1.default.createElement("section", { className: classes, style: style },
        react_1.default.createElement("div", { className: `${baseClass}__wrap` }, children)));
};
exports.default = Minimal;
//# sourceMappingURL=index.js.map