"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("./index.scss");
// Handles boolean values
const Checkbox = ({ data }) => (react_1.default.createElement("code", { className: "bool-cell" },
    react_1.default.createElement("span", null, JSON.stringify(data))));
exports.default = Checkbox;
//# sourceMappingURL=index.js.map