"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const H2_1 = __importDefault(require("../../../../../icons/headings/H2"));
const H2 = ({ attributes, children }) => (react_1.default.createElement("h2", { ...attributes }, children));
const h2 = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "h2" },
        react_1.default.createElement(H2_1.default, null))),
    Element: H2,
};
exports.default = h2;
//# sourceMappingURL=index.js.map