"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const Chevron = ({ className }) => (react_1.default.createElement("svg", { className: [
        'icon icon--chevron',
        className,
    ].filter(Boolean).join(' '), xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 25" },
    react_1.default.createElement("path", { className: "stroke", d: "M9 10.5L12.5 14.5L16 10.5" })));
exports.default = Chevron;
//# sourceMappingURL=index.js.map