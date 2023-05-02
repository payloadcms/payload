"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Underline_1 = __importDefault(require("../../../../../icons/Underline"));
const Underline = ({ attributes, children }) => (react_1.default.createElement("u", { ...attributes }, children));
const underline = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "underline" },
        react_1.default.createElement(Underline_1.default, null))),
    Leaf: Underline,
};
exports.default = underline;
//# sourceMappingURL=index.js.map