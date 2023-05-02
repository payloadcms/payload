"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H3_1 = __importDefault(require("../../../../../icons/headings/H3"));
const H3 = ({ attributes, children }) => (react_1.default.createElement("h3", { ...attributes }, children));
const h3 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h3" },
        react_1.default.createElement(H3_1.default, null))),
    Element: H3,
};
exports.default = h3;
//# sourceMappingURL=index.js.map