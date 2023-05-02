"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("../Button"));
const Italic_1 = __importDefault(require("../../../../../icons/Italic"));
const Italic = ({ attributes, children }) => (react_1.default.createElement("em", { ...attributes }, children));
const italic = {
    Button: () => (react_1.default.createElement(Button_1.default, { format: "italic" },
        react_1.default.createElement(Italic_1.default, null))),
    Leaf: Italic,
};
exports.default = italic;
//# sourceMappingURL=index.js.map