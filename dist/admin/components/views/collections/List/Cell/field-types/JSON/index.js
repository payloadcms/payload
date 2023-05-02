"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
const JSONCell = ({ data }) => {
    const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data;
    return (react_1.default.createElement("code", { className: "json-cell" },
        react_1.default.createElement("span", null, JSON.stringify(textToShow))));
};
exports.default = JSONCell;
//# sourceMappingURL=index.js.map