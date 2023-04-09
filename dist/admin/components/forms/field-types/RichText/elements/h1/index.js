"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H1_1 = __importDefault(require("../../../../../icons/headings/H1"));
const H1 = ({ attributes, children }) => (react_1.default.createElement("h1", { ...attributes }, children));
const h1 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h1" },
        react_1.default.createElement(H1_1.default, null))),
    Element: H1,
};
exports.default = h1;
//# sourceMappingURL=index.js.map