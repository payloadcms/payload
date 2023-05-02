"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H4_1 = __importDefault(require("../../../../../icons/headings/H4"));
const H4 = ({ attributes, children }) => (react_1.default.createElement("h4", { ...attributes }, children));
const h4 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h4" },
        react_1.default.createElement(H4_1.default, null))),
    Element: H4,
};
exports.default = h4;
//# sourceMappingURL=index.js.map