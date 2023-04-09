"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const DragHandle = ({ className }) => (react_1.default.createElement("svg", { className: [
        'icon icon--drag-handle',
        className,
    ].filter(Boolean).join(' '), viewBox: "0 0 25 25", xmlns: "http://www.w3.org/2000/svg" },
    react_1.default.createElement("circle", { cx: "10.468", cy: "14.5", r: "1", className: "fill" }),
    react_1.default.createElement("circle", { cx: "14.532", cy: "14.5", r: "1", className: "fill" }),
    react_1.default.createElement("circle", { cx: "10.468", cy: "11.35", r: "1", className: "fill" }),
    react_1.default.createElement("circle", { cx: "14.532", cy: "11.35", r: "1", className: "fill" }),
    react_1.default.createElement("circle", { cx: "10.468", cy: "8.3", r: "1", className: "fill" }),
    react_1.default.createElement("circle", { cx: "14.532", cy: "8.3", r: "1", className: "fill" })));
exports.default = DragHandle;
//# sourceMappingURL=index.js.map