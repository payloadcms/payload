"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H6_1 = __importDefault(require("../../../../../icons/headings/H6"));
const H6 = ({ attributes, children }) => (react_1.default.createElement("h6", { ...attributes }, children));
const h6 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h6" },
        react_1.default.createElement(H6_1.default, null))),
    Element: H6,
};
exports.default = h6;
//# sourceMappingURL=index.js.map