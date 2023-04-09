"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const RichTextCell = ({ data }) => {
    const flattenedText = data === null || data === void 0 ? void 0 : data.map((i) => { var _a; return (_a = i === null || i === void 0 ? void 0 : i.children) === null || _a === void 0 ? void 0 : _a.map((c) => c.text); }).join(' ');
    const textToShow = (flattenedText === null || flattenedText === void 0 ? void 0 : flattenedText.length) > 100 ? `${flattenedText.slice(0, 100)}\u2026` : flattenedText;
    return (react_1.default.createElement("span", null, textToShow));
};
exports.default = RichTextCell;
//# sourceMappingURL=index.js.map