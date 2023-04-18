"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const X = ({ className }) => (react_1.default.createElement("svg", { width: "25", height: "25", className: [
        className,
        'icon icon--x',
    ].filter(Boolean).join(' '), xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 25" },
    react_1.default.createElement("line", { className: "stroke", x1: "8.74612", y1: "16.347", x2: "16.3973", y2: "8.69584" }),
    react_1.default.createElement("line", { className: "stroke", x1: "8.6027", y1: "8.69585", x2: "16.2539", y2: "16.3471" })));
exports.default = X;
//# sourceMappingURL=index.js.map