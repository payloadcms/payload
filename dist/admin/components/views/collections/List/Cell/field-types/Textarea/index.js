"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const TextareaCell = ({ data }) => {
    const textToShow = (data === null || data === void 0 ? void 0 : data.length) > 100 ? `${data.substr(0, 100)}\u2026` : data;
    return (react_1.default.createElement("span", null, textToShow));
};
exports.default = TextareaCell;
//# sourceMappingURL=index.js.map