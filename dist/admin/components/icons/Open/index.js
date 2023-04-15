"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const Open = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", className: "icon icon--open" },
    react_1.default.createElement("path", { className: "fill", d: "M3 21V3h9v2H5v14h14v-7h2v9Zm6.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4Z" })));
exports.default = Open;
